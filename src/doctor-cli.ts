import { callBazelTool } from './tools/index.js';

const result = await callBazelTool('bazel_ios_health', {});
const text = result.content
  .filter((item): item is { type: 'text'; text: string } => item.type === 'text')
  .map((item) => item.text)
  .join('\n');
console.log(text);
if (result.isError) {
  process.exitCode = 1;
}
