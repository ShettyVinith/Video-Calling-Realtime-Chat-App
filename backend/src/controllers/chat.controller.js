import { generateStreamToken } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    const token = await generateStreamToken(req.user.id);
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error generating stream token:", error.message);
    res.status(500).json({ error: "Failed to generate stream token" });
  }
}
