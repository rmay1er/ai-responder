import { AIResponderV2, createOpenAI } from "./dist/main.js";
import { tool } from "ai";
import z from "zod";

const getData = tool({
  description: "Получить подробную информацию о городе",
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
    console.log(`Chosen city:` + city);
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

const openai = createOpenAI({
  modelId: "gpt-4.1-mini",
  fetch: (url, init) => {
    return fetch(url, {
      ...init,
      proxy: "",
    });
  },
});

const cityAgent = new AIResponderV2({
  model: openai,
  instructions: "Ты ИИ-агент, знаток гоородов",
  tools: { getData },
}).asTool({
  name: "gorod",
  description: "Спросить ИИ агента - эксперта по городам",
  function: (question) =>
    console.log("ИИ агент запросил информацию о городе" + question),
});

const main = new AIResponderV2({
  model: openai,
  instructions: "Ты TeamLead и у тебя в подчинении есть ИИ-агенты.",
  tools: { cityAgent },
});

for await (let line of console) {
  console.log(openai.modelId);
  const response = await main.getContextResponse("console_session", line);
  const data = response.steps.flatMap((step) => {
    return { toolCall: step.toolCalls, toolRes: step.toolResults };
  });
  console.log(...data);
  console.log(response.text);
  // console.log(JSON.stringify(response, null, 2));
  console.write("You: ");
}

// let stage = 1;

// for await (let line of console) {
//   const response = await aiModule.getStructuredObject("console_session", line, {
//     schema,
//     schemaName: "UserProfile",
//     schemaDescription: "A profile of a user including name, age, and city.",
//   });
//   console.log(response.object);
//   // console.log(JSON.stringify(response, null, 2));
//   console.write("You: ");
// }
