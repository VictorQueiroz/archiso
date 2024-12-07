export default function joinStream(
  stream: NodeJS.WritableStream | NodeJS.ReadableStream,
) {
  return new Promise<void>((resolve, reject) => {
    stream.on("end", resolve);
    stream.on("error", reject);
  });
}
