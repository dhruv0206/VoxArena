"""
Custom Resemble AI TTS plugin for LiveKit Agents.

Uses the streaming synthesis API for low-latency voice:
https://docs.resemble.ai/voice-generation/text-to-speech/streaming-http
"""

import os
import logging
from typing import Any
import httpx
from livekit.agents import tts, APIConnectOptions
import uuid
import struct

logger = logging.getLogger("resemble-tts")


def _skip_wav_header(data: bytes) -> tuple[bytes, int, int]:
    """
    Parse WAV header and return (audio_data, sample_rate, num_channels).
    WAV files have a variable-length header, so we need to find the 'data' chunk.
    """
    if len(data) < 44:
        # Not enough data for a full WAV header
        return data, 0, 0
    
    # Check for RIFF header
    if data[:4] != b'RIFF' or data[8:12] != b'WAVE':
        # Not a WAV file, return as-is (might be raw PCM)
        return data, 0, 0
    
    pos = 12
    sample_rate = 0
    num_channels = 0
    
    while pos < len(data) - 8:
        chunk_id = data[pos:pos+4]
        chunk_size = struct.unpack('<I', data[pos+4:pos+8])[0]
        
        if chunk_id == b'fmt ':
            if pos + 8 + chunk_size <= len(data):
                # Parse fmt chunk
                fmt_data = data[pos+8:pos+8+chunk_size]
                if len(fmt_data) >= 8:
                    num_channels = struct.unpack('<H', fmt_data[2:4])[0]
                    sample_rate = struct.unpack('<I', fmt_data[4:8])[0]
        elif chunk_id == b'data':
            # Return audio data starting after this chunk header
            audio_start = pos + 8
            return data[audio_start:], sample_rate, num_channels
        
        pos += 8 + chunk_size
        # Align to 2-byte boundary
        if chunk_size % 2 != 0:
            pos += 1
    
    # Couldn't find data chunk, return original
    return data, sample_rate, num_channels


class ResembleTTS(tts.TTS):
    """
    Text-to-Speech using Resemble AI API.
    
    This implementation supports synthesis (text -> audio stream).
    
    Requires:
    - RESEMBLE_API_KEY
    - RESEMBLE_VOICE_UUID
    """
    
    def __init__(
        self,
        *,
        api_key: str | None = None,
        voice_uuid: str | None = None,
        project_uuid: str | None = None,
        sample_rate: int = 22050,
    ):
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=sample_rate,
            num_channels=1,
        )
        
        self._api_key = api_key or os.environ.get("RESEMBLE_API_KEY")
        self._voice_uuid = voice_uuid or os.environ.get("RESEMBLE_VOICE_UUID")
        self._project_uuid = project_uuid or os.environ.get("RESEMBLE_PROJECT_UUID")
        
        if not self._api_key:
            raise ValueError("RESEMBLE_API_KEY is required")
        if not self._voice_uuid:
            raise ValueError("RESEMBLE_VOICE_UUID is required")
        
        self._http_client: httpx.AsyncClient | None = None
        
        logger.info(f"Initialized Resemble TTS with voice: {self._voice_uuid}")
    
    def _ensure_client(self) -> httpx.AsyncClient:
        """Lazily create the HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=60.0)
        return self._http_client
    
    async def aclose(self) -> None:
        """Close the HTTP client."""
        if self._http_client is not None:
            await self._http_client.aclose()
            self._http_client = None
    
    def synthesize(
        self,
        text: str,
        *,
        conn_options: APIConnectOptions = APIConnectOptions(),
    ) -> "ResembleChunkedStream":
        """Synthesize text to speech using Resemble AI streaming."""
        return ResembleChunkedStream(
            tts=self,
            input_text=text,
            conn_options=conn_options,
            api_key=self._api_key,
            voice_uuid=self._voice_uuid,
            project_uuid=self._project_uuid,
            sample_rate=self._sample_rate,
        )


class ResembleChunkedStream(tts.ChunkedStream):
    """Streaming chunk for Resemble AI TTS."""
    
    def __init__(
        self,
        *,
        tts: ResembleTTS,
        input_text: str,
        conn_options: APIConnectOptions,
        api_key: str,
        voice_uuid: str,
        project_uuid: str | None,
        sample_rate: int,
    ):
        super().__init__(tts=tts, input_text=input_text, conn_options=conn_options)
        self._resemble_tts = tts
        self._api_key = api_key
        self._voice_uuid = voice_uuid
        self._project_uuid = project_uuid
        self._sample_rate = sample_rate
    
    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        """Stream audio from Resemble AI."""
        request_id = str(uuid.uuid4())
        http_client = self._resemble_tts._ensure_client()
        
        try:
            # Build payload according to Resemble API docs
            # https://docs.resemble.ai/voice-generation/text-to-speech/streaming-http
            payload = {
                "voice_uuid": self._voice_uuid,
                "data": self._input_text,
                "sample_rate": self._sample_rate,
                "precision": "PCM_16",
            }
            if self._project_uuid:
                payload["project_uuid"] = self._project_uuid

            logger.debug(f"Sending TTS request for text: {self._input_text[:50]}...")

            # Use the HTTP streaming synthesis endpoint
            async with http_client.stream(
                "POST",
                "https://f.cluster.resemble.ai/stream",
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            ) as response:
                if response.status_code >= 400:
                    error_content = await response.aread()
                    error_msg = error_content.decode('utf-8')
                    logger.error(f"Resemble AI HTTP error: {response.status_code} - {error_msg}")
                    raise RuntimeError(f"Resemble AI error {response.status_code}: {error_msg}")
                
                # Collect all data first to handle WAV header
                all_data = b""
                async for chunk in response.aiter_bytes():
                    all_data += chunk
                
                if not all_data:
                    logger.warning("Empty response from Resemble AI")
                    return
                
                # Parse WAV and extract audio data
                audio_data, detected_sample_rate, num_channels = _skip_wav_header(all_data)
                
                # Use detected sample rate if available, otherwise use configured
                actual_sample_rate = detected_sample_rate if detected_sample_rate > 0 else self._sample_rate
                actual_channels = num_channels if num_channels > 0 else 1
                
                logger.debug(f"Received {len(audio_data)} bytes of audio data, sample_rate={actual_sample_rate}")
                
                # Initialize the emitter with audio format
                # mime_type for 16-bit PCM audio
                output_emitter.initialize(
                    request_id=request_id,
                    sample_rate=actual_sample_rate,
                    num_channels=actual_channels,
                    mime_type="audio/pcm",
                )
                
                # Push audio data in chunks
                chunk_size = 4096
                offset = 0
                
                while offset < len(audio_data):
                    audio_chunk = audio_data[offset:offset + chunk_size]
                    offset += chunk_size
                    
                    # Ensure even number of bytes for 16-bit PCM
                    if len(audio_chunk) % 2 != 0:
                        audio_chunk = audio_chunk[:-1]
                    
                    if len(audio_chunk) > 0:
                        output_emitter.push(audio_chunk)
                
                # Signal end of audio
                output_emitter.flush()
                
                logger.debug(f"Finished sending audio for request {request_id}")
                    
        except httpx.HTTPStatusError as e:
            logger.error(f"Resemble AI HTTP status error: {e}")
            raise RuntimeError(f"Resemble AI TTS error: {e}")
        except httpx.RequestError as e:
            logger.error(f"Resemble AI request error: {e}")
            raise RuntimeError(f"Resemble AI TTS error: {e}")
        except Exception as e:
            logger.error(f"Resemble AI TTS error: {e}")
            raise RuntimeError(f"Resemble AI TTS error: {e}")
