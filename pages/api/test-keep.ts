import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";

    privateKey = privateKey.replace(/\\n/g, "\n");

    if (!email || !privateKey) {
      throw new Error("Missing Google service account environment variables.");
    }

    const jwtClient = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/keep"],
    });

    const keep = google.keep({
      version: "v1",
      auth: jwtClient,
    });

    // List notes
    const listResponse = await keep.notes.list({ pageSize: 10 });
    const notes = listResponse.data.notes || [];

    // Create a new note with only a title
    const createResponse = await keep.notes.create({
      requestBody: {
        title: "Test Note from Next.js API",
      },
    });

    res.status(200).json({
      message: "Successfully accessed Google Keep API!",
      existingNotes: notes,
      createdNote: createResponse.data,
    });
  } catch (error) {
    console.error("Error accessing Google Keep API:", error);
    res.status(500).json({
      message: "Error accessing Google Keep API",
      error: (error as Error).message,
    });
  }
}

