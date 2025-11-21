import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import firestore from "@react-native-firebase/firestore";
import { useFlashcardStore } from "@/hooks/flashcard-store";

const ModeratorPanel = () => {
  const role = useFlashcardStore((state) => state.role);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  if (role !== "moderator") return <Text>Access Denied</Text>;

  const submitContent = async () => {
    if (!title || !content) return Alert.alert("All fields required");

    await firestore().collection("communityContent").add({
      title,
      content,
      status: "pending",
      createdBy: firestore().app.auth().currentUser?.uid,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    Alert.alert("Content submitted for approval!");
    setTitle("");
    setContent("");
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: "bold", fontSize: 18 }}>Moderator Panel</Text>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={{
          borderWidth: 1,
          marginVertical: 8,
          padding: 8,
          borderRadius: 8,
        }}
      />
      <TextInput
        placeholder="Content"
        value={content}
        onChangeText={setContent}
        style={{
          borderWidth: 1,
          marginVertical: 8,
          padding: 8,
          borderRadius: 8,
          height: 120,
        }}
        multiline
      />
      <Button title="Submit for Approval" onPress={submitContent} />
    </View>
  );
};

export default ModeratorPanel;
