import { useEffect, useState, type ReactNode } from "react";
import { Keyboard, Platform, ScrollView, View } from "react-native";
import { Styles } from "@/constants/styles";

const SHOW_EVENT = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const HIDE_EVENT = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

export function KeyboardSafeModalBody({ children }: { children: ReactNode }) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(SHOW_EVENT, (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(HIDE_EVENT, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <View style={[Styles.modalOverlay, { paddingBottom: 20 + keyboardHeight }]}>
      <View style={[Styles.modalContent, { maxHeight: "100%" }]}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
