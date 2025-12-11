import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SignUpScreen from "@/app/screens/signup";
import LoginScreen from "@/app/screens/login";
import SettingsScreen from "@/app/screens/settings";
import auth from "@react-native-firebase/auth";
import * as secureStore from "@/app/utils/secureStore";

const mockUser: any = {
  uid: "123",
  email: "pocketlingo@yopmail.com",
  displayName: "Stratizen",
  isAnonymous: false,
  emailVerified: true,
  metadata: {
    creationTime: "2025-01-01T00:00:00Z",
    lastSignInTime: "2025-01-01T00:00:00Z",
  },
  phoneNumber: null,
  photoURL: null,
  providerData: [],
  refreshToken: "mock-refresh-token",
  delete: jest.fn(),
  getIdToken: jest.fn().mockResolvedValue("mock-token"),
  getIdTokenResult: jest.fn(),
  reload: jest.fn().mockResolvedValue(undefined),
  sendEmailVerification: jest.fn().mockResolvedValue(undefined),
  updateEmail: jest.fn(),
  updatePassword: jest.fn(),
  updateProfile: jest.fn().mockResolvedValue(undefined),
  linkWithCredential: jest.fn(),
  unlink: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  toJSON: jest.fn(),
};

const mockUserCredential: any = {
  user: mockUser,
};

jest.mock("@react-native-firebase/auth", () => {
  return () => ({
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    currentUser: mockUser,
  });
});

jest.mock("@/app/utils/secureStore", () => ({
  saveSecureItem: jest.fn(),
  getSecureItem: jest.fn(),
  deleteSecureItem: jest.fn(),
}));

const mockNavigation = {
  replace: jest.fn(),
  navigate: jest.fn(),
  reset: jest.fn(),
};

describe("Auth Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Sign up success flow", async () => {
    const createUserMock = jest
      .spyOn(auth(), "createUserWithEmailAndPassword")
      .mockResolvedValue(mockUserCredential);

    const { getByPlaceholderText, getByText } = render(
      <SignUpScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText("Username"), "Stratizen");
    fireEvent.changeText(
      getByPlaceholderText("Email"),
      "pocketlingo@yopmail.com",
    );
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(createUserMock).toHaveBeenCalledWith(
        "pocketlingo@yopmail.com",
        "password123",
      );
      expect(secureStore.saveSecureItem).toHaveBeenCalledWith(
        "userToken",
        "mock-token",
      );
      expect(mockNavigation.replace).toHaveBeenCalledWith("MainTabs");
    });
  });

  it("Login success flow", async () => {
    const signInMock = jest
      .spyOn(auth(), "signInWithEmailAndPassword")
      .mockResolvedValue(mockUserCredential);

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(
      getByPlaceholderText("Email"),
      "pocketlingo@yopmail.com",
    );
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith(
        "pocketlingo@yopmail.com",
        "password123",
      );
      expect(secureStore.saveSecureItem).toHaveBeenCalledWith(
        "userToken",
        "mock-token",
      );
      expect(mockNavigation.replace).toHaveBeenCalledWith("MainTabs");
    });
  });

  it("Logout success flow", async () => {
    const signOutMock = jest
      .spyOn(auth(), "signOut")
      .mockResolvedValue(undefined);

    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText("Logout"));
    fireEvent.press(getByText("Logout"));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
      expect(secureStore.deleteSecureItem).toHaveBeenCalledWith("userToken");
    });
  });
});
