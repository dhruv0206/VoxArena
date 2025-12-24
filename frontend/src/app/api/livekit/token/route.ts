import { AccessToken, RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { roomName } = await request.json();

    if (!roomName) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: "LiveKit credentials not configured" },
        { status: 500 }
      );
    }

    // Create the room first (if needed) and dispatch agent
    const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
    const agentDispatch = new AgentDispatchClient(wsUrl, apiKey, apiSecret);
    
    try {
      // Create room if it doesn't exist
      await roomService.createRoom({ name: roomName });
      
      // Dispatch the agent to join this room
      await agentDispatch.createDispatch(roomName, "voxarena-agent");
      console.log(`Dispatched agent to room: ${roomName}`);
    } catch (err) {
      // Room might already exist, that's okay
      console.log("Room/dispatch setup:", err);
    }

    // Generate user token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      ttl: "10m",
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    // Create session in backend for tracking
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/sessions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_name: roomName,
          user_id: userId,
          agent_id: null,
        }),
      });
    } catch (sessionError) {
      console.error("Failed to create session record:", sessionError);
      // Don't fail the token request if session creation fails
    }

    return NextResponse.json({
      token,
      wsUrl,
      roomName,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
