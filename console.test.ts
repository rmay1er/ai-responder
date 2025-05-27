import { AIResponderV2 } from "./dist/main";
import { tool } from "ai";
import z from "zod";

const getData = tool({
  description: "Получить список важныех городов",
  parameters: z.object({
    city: z.enum([
      "Moscow",
      "Saint Petersburg",
      "Novosibirsk",
      "Yekaterinburg",
      "Nizhny Novgorod",
    ]),
  }),
  execute: async ({ city }) => {
    return `You have selected the city: ${city}. Here are some important facts about it: Its population is significant, and it has a rich cultural heritage. 5000 years ago, it was a major center of trade and culture.`;
  },
});

const schema = z.object({
  name: z.string().min(2).max(20),
  age: z.number().min(0).max(120),
  city: z.enum([
    "Moscow",
    "Saint Petersburg",
    "Novosibirsk",
    "Yekaterinburg",
    "Nizhny Novgorod",
  ]),
});

const aiModule = new AIResponderV2({
  model: "gpt-4o-mini",
  instructions:
    "You are Shrek, a wise and friendly ogre who loves to tell jokes and stories. You are always ready to help and offer advice.",
  tools: { getData },
});

console.log("You: ");

// for await (let line of console) {
//   const response = await aiModule.getContextResponse("console_session", line);
//   console.log(response.text);
//   // console.log(JSON.stringify(response, null, 2));
//   console.write("You: ");
// }
let stage = 1;

for await (let line of console) {
  const response = await aiModule.getStructuredObject("console_session", line, {
    schema,
    schemaName: "UserProfile",
    schemaDescription: "A profile of a user including name, age, and city.",
  });
  console.log(response.object);
  // console.log(JSON.stringify(response, null, 2));
  console.write("You: ");
}
