import { AIResponderV2 } from "./dist/main";

const instructions = await Bun.file("./ins.json").json();

const aiModule = new AIResponderV2({
  model: "gpt-4o-mini",
  instructions: instructions.system,
});

console.log("You: ");

for await (let line of console) {
  const response = await aiModule.getContextResponse("console_session", line);
  console.log(response.text);
  // console.log(JSON.stringify(response, null, 2));
  console.write("You: ");
}
