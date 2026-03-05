import React, { useState, useRef } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi, aiApi } from "../lib/api";
import { Badge, C } from "../components/UI";

interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  streaming: boolean;
}

export default function AIScreen() {
  const [question, setQuestion] = useState("");
  const [messages,  setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef     = useRef<ScrollView>(null);

  // Get assigned vehicle
  const { data: vehicleRes } = useQuery({
    queryKey: ["my-vehicle"],
    queryFn:  () => vehiclesApi.myVehicle().then((r) => r.data),
    refetchInterval: 15_000,
  });

  const myVehicle = vehicleRes?.data ?? null;

  const askQuestion = () => {
    if (!question.trim() || !myVehicle || streaming) return;

    const q = question.trim();
    setQuestion("");

    // Add user message
    const userMsg: Message = {
      id:        Date.now().toString(),
      role:      "user",
      content:   q,
      streaming: false,
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id:        assistantId,
      role:      "assistant",
      content:   "",
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    aiApi.askSSE(
      q,
      myVehicle.id,
      // onToken
      (token) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + token }
              : m
          )
        );
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
      },
      // onDone
      () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
        setStreaming(false);
      },
      // onError
      (err) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `⚠️ ${err}`, streaming: false }
              : m
          )
        );
        setStreaming(false);
      }
    );
  };

  const QUICK_QUESTIONS = [
    "How do I reset the tire pressure sensor?",
    "What is the oil change interval?",
    "How do I check coolant level?",
    "Dashboard warning lights explained",
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{
        paddingHorizontal: 20,
        paddingVertical:   14,
        borderBottomColor: C.border,
        borderBottomWidth: 1,
        flexDirection:     "row",
        alignItems:        "center",
        justifyContent:    "space-between",
      }}>
        <View>
          <Text style={{
            color:         C.amber,
            fontSize:      11,
            fontWeight:    "700",
            letterSpacing: 3,
          }}>
            AI ASSISTANT
          </Text>
          {myVehicle && (
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
              {myVehicle.make} {myVehicle.model} · {myVehicle.licensePlate}
            </Text>
          )}
        </View>
        {myVehicle?.hasManual ? (
          <Badge color="green">MANUAL LOADED</Badge>
        ) : (
          <Badge color="slate">NO MANUAL</Badge>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 && (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{
                color:     C.faint,
                fontSize:  14,
                textAlign: "center",
                marginBottom: 24,
                letterSpacing: 0.5,
              }}>
                Ask anything about your vehicle
              </Text>

              {/* Quick questions */}
              <View style={{ gap: 8 }}>
                {QUICK_QUESTIONS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => {
                      setQuestion(q);
                    }}
                    style={{
                      backgroundColor: C.surface,
                      borderColor:     C.border,
                      borderWidth:     1,
                      padding:         14,
                      borderRadius:    2,
                    }}
                  >
                    <Text style={{ color: C.muted, fontSize: 13 }}>
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((msg) => (
            <View
              key={msg.id}
              style={{
                alignSelf:    msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth:     "88%",
                marginBottom: 4,
              }}
            >
              {msg.role === "user" ? (
                <View style={{
                  backgroundColor: C.amber + "20",
                  borderColor:     C.amber + "40",
                  borderWidth:     1,
                  padding:         12,
                  borderRadius:    2,
                }}>
                  <Text style={{ color: C.text, fontSize: 14 }}>
                    {msg.content}
                  </Text>
                </View>
              ) : (
                <View style={{
                  backgroundColor: C.surface,
                  borderColor:     C.border,
                  borderWidth:     1,
                  padding:         14,
                  borderRadius:    2,
                }}>
                  <Text style={{
                    color:      C.amber,
                    fontSize:   10,
                    fontWeight: "700",
                    letterSpacing: 2,
                    marginBottom: 8,
                  }}>
                    FLEET AI
                  </Text>
                  {msg.content ? (
                    <Text style={{
                      color:      C.text,
                      fontSize:   14,
                      lineHeight: 22,
                    }}>
                      {msg.content}
                    </Text>
                  ) : (
                    <ActivityIndicator size="small" color={C.amber} />
                  )}
                  {msg.streaming && msg.content && (
                    <View style={{
                      width:           8,
                      height:          14,
                      backgroundColor: C.amber,
                      marginTop:       4,
                      opacity:         0.8,
                    }} />
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={{
          paddingHorizontal: 16,
          paddingVertical:   12,
          paddingBottom:     Platform.OS === "ios" ? 8 : 12,
          borderTopColor:    C.border,
          borderTopWidth:    1,
          flexDirection:     "row",
          gap:               10,
          backgroundColor:   C.bg,
        }}>
          <TextInput
            style={{
              flex:            1,
              backgroundColor: C.surface,
              borderColor:     C.border2,
              borderWidth:     1,
              color:           C.text,
              fontSize:        15,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius:    2,
              minHeight:       48,
              maxHeight:       120,
            }}
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask about your vehicle..."
            placeholderTextColor={C.faint}
            multiline
            returnKeyType="send"
            onSubmitEditing={askQuestion}
            blurOnSubmit
          />
          <TouchableOpacity
            onPress={askQuestion}
            disabled={!question.trim() || streaming || !myVehicle}
            style={{
              width:           48,
              height:          48,
              backgroundColor: question.trim() && !streaming ? C.amber : C.faint,
              alignItems:      "center",
              justifyContent:  "center",
              borderRadius:    2,
              opacity:         !question.trim() || streaming ? 0.5 : 1,
            }}
          >
            {streaming ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={{ fontSize: 20, color: "#000", fontWeight: "900" }}>
                ↑
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
