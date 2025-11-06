import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SignUpScreen from "@/app/screens/signup";
import { getAuth } from "@/firebase/firebaseConfig";

// mock firebase auth
jest.mock("@/firebase/firebaseConfig", () => ({
  getAuth: jest.fn(),
}));

const mockNavigation = { navigate: jest.fn(), replace: jest.fn() };

describe("SignUpScreen", () => {
  let createUserWithEmailAndPasswordMock: jest.Mock;

  beforeEach(() => {
    createUserWithEmailAndPasswordMock = jest.fn();
    (getAuth as jest.Mock).mockReturnValue({
      createUserWithEmailAndPassword: createUserWithEmailAndPasswordMock,
    });
  });

  it("renders correctly", () => {
    const { getByPlaceholderText, getByText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    expect(getByPlaceholderText("Username")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Sign Up")).toBeTruthy();
  });

  it("shows error when fields are empty", async () => {
    const { getByText } = render(<SignUpScreen navigation={mockNavigation} />);
    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(getByText("Please fill in all fields.")).toBeTruthy();
    });
  });

  it("shows error for invalid email", async () => {
    const { getByPlaceholderText, getByText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText("Username"), "Stratizen");
    fireEvent.changeText(getByPlaceholderText("Email"), "invalid-email");
    fireEvent.changeText(getByPlaceholderText("Password"), "123456");
    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(getByText("Please enter a valid email address.")).toBeTruthy();
    });
  });

  it("shows error for short password", async () => {
    const { getByPlaceholderText, getByText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText("Username"), "Stratizen");
    fireEvent.changeText(
      getByPlaceholderText("Email"),
      "pocketlingo@yopmail.com"
    );
    fireEvent.changeText(getByPlaceholderText("Password"), "123");
    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(
        getByText("Password must be at least 6 characters long.")
      ).toBeTruthy();
    });
  });

  it("calls Firebase and navigates on successful signup", async () => {
    createUserWithEmailAndPasswordMock.mockResolvedValue({
      user: { updateProfile: jest.fn() },
    });

    const { getByPlaceholderText, getByText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText("Username"), "Stratizen");
    fireEvent.changeText(
      getByPlaceholderText("Email"),
      "pocketlingo@yopmail.com"
    );
    fireEvent.changeText(getByPlaceholderText("Password"), "123456");
    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(createUserWithEmailAndPasswordMock).toHaveBeenCalledWith(
        "pocketlingo@yopmail.com",
        "123456"
      );
      expect(mockNavigation.replace).toHaveBeenCalledWith("Login");
    });
  });

  it("shows error if Firebase signup fails", async () => {
    createUserWithEmailAndPasswordMock.mockRejectedValue({
      message: "Firebase error",
    });

    const { getByPlaceholderText, getByText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText("Username"), "Stratizen");
    fireEvent.changeText(
      getByPlaceholderText("Email"),
      "pocketlingo@yopmail.com"
    );
    fireEvent.changeText(getByPlaceholderText("Password"), "123456");
    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(getByText("Firebase error")).toBeTruthy();
    });
  });
});
