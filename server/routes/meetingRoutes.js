
const express = require("express");
const crypto = require("crypto");
const Meeting = require("../models/Meeting");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE MEETING
router.post("/", authMiddleware, async (req, res) => {
  try {
    const meetingId = crypto.randomBytes(8).toString("hex").toUpperCase();

    const meeting = await Meeting.create({
      meetingId,
      host: req.user.userId,
      participants: [req.user.userId],
    });

    return res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      meeting: {
        meetingId: meeting.meetingId,
        status: meeting.status,
        createdAt: meeting.createdAt,
      },
    });
  } catch (error) {
    console.error("Create meeting error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create meeting",
    });
  }
});

// VERIFY MEETING BEFORE JOINING
router.post("/join", authMiddleware, async (req, res) => {
  try {
    const { meetingId } = req.body;

   if (
  typeof meetingId !== "string" ||
  !/^[A-F0-9]{16}$/i.test(meetingId.trim())
) {
  return res.status(400).json({
    success: false,
    message: "Invalid meeting ID",
  });
}

    const meeting = await Meeting.findOne({
      meetingId: meetingId.trim().toUpperCase(),
      status: "active",
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found or has ended",
      });
    }

    const userId = req.user.userId;
    const alreadyJoined = meeting.participants.some(
      (participantId) => participantId.toString() === userId
    );

    if (!alreadyJoined) {
      meeting.participants.push(userId);
      await meeting.save();
    }

    return res.json({
      success: true,
      message: "Meeting access verified",
      meeting: {
        meetingId: meeting.meetingId,
        status: meeting.status,
      },
    });
  } catch (error) {
    console.error("Join meeting error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify meeting access",
    });
  }
});

module.exports = router;
