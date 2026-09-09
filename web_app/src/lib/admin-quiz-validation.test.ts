import { quizValidationErrors, quizServerError } from "./admin-quiz-form";

const t = (key: string) => key;
const form = () => ({
  categoryCode: "TH01", difficultyLevel: "EASY", contentImageUrl: "",
  questionEn: "Question", questionAr: "سؤال", questionNl: "Vraag", questionFr: "Question",
  options: [
    { textEn: "Yes", textAr: "نعم", textNl: "Ja", textFr: "Oui", isCorrect: true, displayOrder: 1 },
    { textEn: "No", textAr: "لا", textNl: "Nee", textFr: "Non", isCorrect: false, displayOrder: 2 },
  ],
});

test("valid multilingual question is accepted", () => {
  expect(quizValidationErrors(form(), ["TH01"], t)).toEqual({});
});
test.each(["En", "Ar", "Nl", "Fr"] as const)("detects duplicates in %s", (lang) => {
  const value = form();
  value.options[1][`text${lang}`] = ` ${value.options[0][`text${lang}`]} `;
  expect(quizValidationErrors(value, ["TH01"], t)["option_1"]).toBeTruthy();
});
test("rejects placeholder, invalid image, unavailable category and missing correct answer", () => {
  const value = form();
  value.options[0].textEn = "Option A";
  value.options[0].isCorrect = false;
  value.contentImageUrl = "http://example.com/image.png";
  const errors = quizValidationErrors(value, [], t);
  expect(errors).toMatchObject({ categoryCode: expect.any(String), contentImageUrl: expect.any(String), correct: expect.any(String), option_0: expect.any(String) });
});
test("maps nested Bean Validation fields and preserves human response message", () => {
  const error = quizServerError({ response: { data: { error: "Bad Request", message: "Check the fields", fields: { "options[1].textAr": "Arabic option text is required", questionNl: "Dutch question text is required" } } } }, "Fallback");
  expect(error.message).toBe("Check the fields");
  expect(error.fields.option_1).toBe("Arabic option text is required");
  expect(error.fields.questionNl).toBe("Dutch question text is required");
});
