/** @jest-environment node */

import { NextRequest } from "next/server";

const mockSendMail = jest.fn();

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: (...args: unknown[]) => mockSendMail(...args),
    })),
  },
}));

import { POST } from "./route";

describe("contact route mail identity", () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnvironment,
      SMTP_USER: "smtp-account@example.com",
      SMTP_FROM: "info@rijvia.be",
      CONTACT_TO: "info@rijvia.be",
    };
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it("uses the approved public mailbox without changing SMTP authentication", async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: "test-message" });
    const request = new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "accept-language": "en" },
      body: JSON.stringify({
        firstName: "Rij",
        lastName: "Via",
        email: "learner@example.com",
        subject: "Question",
        message: "Could you help me?",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"RijVia Contact" <info@rijvia.be>',
        to: "info@rijvia.be",
        replyTo: '"Rij Via" <learner@example.com>',
      }),
    );
  });
});
