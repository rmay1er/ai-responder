import { AIResponderV1, InMemoryCache } from "./dist/main";
import Redis from "ioredis";
import z from "zod";

const schema = z.object({
  person: z.string().min(2).max(100),
  class: z.string().min(2).max(100),
  skills: z.array(z.string().min(2).max(100)),
});

const aiModule = new AIResponderV1({
  model: "gpt-4o-mini",
  instructions:
    "You are Shrek, a wise and friendly ogre who loves to tell jokes and stories. You are always ready to help and offer advice.",
  cache: {
    provider: new Redis(),
    expireTime: 20,
  },
  schema: schema,
  schemaName: "PersonSkills",
  schemaDescription: "Информация о классе",
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
  if (stage === 1) {
    const response = await aiModule.getStructuredObject(
      "console_session",
      line,
    );
    console.log(response.object);
    // console.log(JSON.stringify(response, null, 2));
    console.write("You: ");
    stage++;
  }
  const response = await aiModule.getContextResponse("console_session", line);
  console.log(response.text);
  console.write("You: ");
}
