/* global device, element, by */

describe("Auth Flow", () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should sign up successfully", async () => {
    await element(by.id("input-username")).typeText("Stratizen");
    await element(by.id("input-email")).typeText("pocketlingo@yopmail.com");
    await element(by.id("input-password")).typeText("password123");
    await element(by.text("Sign Up")).tap();

    await expect(element(by.text("MainTabs"))).toBeVisible();
  });

  it("should log in successfully", async () => {
    await element(by.id("input-email")).typeText("pocketlingo@yopmail.com");
    await element(by.id("input-password")).typeText("password123");
    await element(by.text("Login")).tap();

    await expect(element(by.text("MainTabs"))).toBeVisible();
  });

  it("should log out successfully", async () => {
    await element(by.text("Logout")).tap(); // open modal
    await element(by.text("Logout")).tap(); // confirm

    await expect(element(by.text("Login"))).toBeVisible();
  });
});
