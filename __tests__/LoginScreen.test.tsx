import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "@/app/screens/login";
import { getAuth } from "@/firebase/firebaseConfig";

// mock firebase auth
jest.mock("@/firebase/firebaseConfig", () => ({
  getAuth: jest.fn(),
}));

const mockNavigation = { navigate: jest.fn(), replace: jest.fn() };

describe("LoginScreen", () => {
  let signInWithEmailAndPasswordMock: jest.Mock;

  beforeEach(() => {
    signInWithEmailAndPasswordMock = jest.fn();
    (getAuth as jest.Mock).mockReturnValue({
      signInWithEmailAndPassword: signInWithEmailAndPasswordMock,
    });
  });

  it("renders correctly", () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Login")).toBeTruthy();
  });

  it("shows error when fields are empty", async () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByText("Please fill in all fields.")).toBeTruthy();
    });
  });

  it("shows error for invalid email", async () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText("Email"), "invalid-email");
    fireEvent.changeText(getByPlaceholderText("Password"), "123456");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByText("Please enter a valid email address.")).toBeTruthy();
    });
  });

  it("shows error for short password", async () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(
      getByPlaceholderText("Email"),
      "pocketlingo@yopmail.com"
    );
    fireEvent.changeText(getByPlaceholderText("Password"), "123");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(
        getByText("Password must be at least 6 characters long.")
      ).toBeTruthy();
    });
  });

  it("calls Firebase and navigates on successful login", async () => {
    signInWithEmailAndPasswordMock.mockResolvedValue({
      user: { email: "pocketlingo@yopmail.com" },
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(
      getByPlaceholderText("Email"),
      "pocketlingo@yopmail.com"
    );
    fireEvent.changeText(getByPlaceholderText("Password"), "123456");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(signInWithEmailAndPasswordMock).toHaveBeenCalledWith(
        "pocketlingo@yopmail.com",
        "123456"
      );
      expect(mockNavigation.replace).toHaveBeenCalledWith("MainTabs");
    });
  });

  it("shows error if Firebase login fails with user-not-found", async () => {
    signInWithEmailAndPasswordMock.mockRejectedValue({
      code: "auth/user-not-found",
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(
      getByPlaceholderText("Email"),
      "pocketlingo@yopmail.com"
    );
    fireEvent.changeText(getByPlaceholderText("Password"), "123456");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByText("No account found with this email.")).toBeTruthy();
    });
  });

  it("shows error if Firebase login fails with wrong-password", async () => {
    signInWithEmailAndPasswordMock.mockRejectedValue({
      code: "auth/wrong-password",
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(
      getByPlaceholderText("Email"),
      "pocketlingo@yopmail.com"
    );
    fireEvent.changeText(getByPlaceholderText("Password"), "123456");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(getByText("Incorrect password. Please try again.")).toBeTruthy();
    });
  });

  it("shows generic error if Firebase login fails with other errors", async () => {
    signInWithEmailAndPasswordMock.mockRejectedValue({
      code: "auth/unknown-error",
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(
      getByPlaceholderText("Email"),
      "pocketlingo@yopmail.com"
    );
    fireEvent.changeText(getByPlaceholderText("Password"), "123456");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(
        getByText("Login failed. Please check your credentials.")
      ).toBeTruthy();
    });
  });
});
