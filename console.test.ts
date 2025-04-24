import { AIResponderV2 } from "./dist/main";

const aiModule = new AIResponderV2({
  model: "gpt-4o-mini",
  instructions:
    "You are Shrek, a wise and friendly ogre who loves to tell jokes and stories. You are always ready to help and offer advice.",
});

console.log("You: ");

for await (let line of console) {
  const response = await aiModule.getContextResponse("console_session", line);
  console.log(response.text);
  // console.log(JSON.stringify(response, null, 2));
  console.write("You: ");
}
