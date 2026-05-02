import Toast from "react-native-toast-message";

export function showToast(type: "success" | "error" | "info", title: string, message?: string) {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
}

export function showSuccess(title: string, message?: string) {
  showToast("success", title, message);
}

export function showError(title: string, message?: string) {
  showToast("error", title, message);
}

export function showInfo(title: string, message?: string) {
  showToast("info", title, message);
}
