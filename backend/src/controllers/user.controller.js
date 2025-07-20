import User from "../models/user.js";
import FriendRequest from "../models/FriendRequest.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        { _id: { $nin: currentUser.friends } }, // Exclude current user's friends
        { isOnboarded: true }, // Only include onboarded users
      ],
    });

    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error fetching recommended users:", error.message);
    res.status(500).json({ message: "Error fetching recommended users" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic nativeLanguage learningLanguage"
      );

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error fetching friends:", error.message);
    res.status(500).json({ message: "Error fetching friends" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    //prevent sending friend request to self
    if (myId === recipientId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Check if a friend request already exists
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends" });
    }

    // Check if a pending friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Create a new friend request
    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error sending friend request:", error.message);
    res.status(500).json({ message: "Error sending friend request" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    //Verify that the current user is the recipient of the request
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to each other's friends list
    //$addToSet: adds elements to an array only if they do not already exist
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error accepting friend request:", error.message);
    res.status(500).json({ message: "Error accepting friend request" });
  }
}
