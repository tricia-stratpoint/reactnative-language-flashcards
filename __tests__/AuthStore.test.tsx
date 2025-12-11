import { loginUser, logoutUser } from "@/hooks/auth-store";
import * as secureStore from "@/app/utils/secureStore";

const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockGetIdToken = jest.fn();

jest.mock("@react-native-firebase/auth", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    signInWithEmailAndPassword: mockSignIn,
    signOut: mockSignOut,
  })),
}));

jest.mock("@/app/utils/secureStore", () => ({
  saveSecureItem: jest.fn(),
  deleteSecureItem: jest.fn(),
}));

describe("authstore functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loginUser should sign in and save token", async () => {
    const fakeToken = "abc123";
    mockSignIn.mockResolvedValue({
      user: {
        getIdToken: mockGetIdToken.mockResolvedValue(fakeToken),
      },
    });

    await loginUser("test@example.com", "password");

    expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password");
    expect(mockGetIdToken).toHaveBeenCalled();
    expect(secureStore.saveSecureItem).toHaveBeenCalledWith(
      "userToken",
      fakeToken,
    );
  });

  it("logoutUser should sign out and delete token", async () => {
    await logoutUser();

    expect(mockSignOut).toHaveBeenCalled();
    expect(secureStore.deleteSecureItem).toHaveBeenCalledWith("userToken");
  });
});
