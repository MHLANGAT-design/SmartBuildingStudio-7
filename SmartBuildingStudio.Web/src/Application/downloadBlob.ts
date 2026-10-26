// src/Application/downloadBlob.ts
//
// Trigger a browser download of a Blob or string payload.
//
// Appends the anchor to the DOM before clicking (required by older
// Firefox/Safari versions for the `download` attribute to be honoured),
// removes it after, and revokes the object URL on the next tick.
//
// The setTimeout is load-bearing: revoking the object URL synchronously
// after `a.click()` can abort the browser's read of the Blob before the
// download has actually started, producing a zero-byte or truncated
// file. Chrome usually tolerates it; Safari does not. The race is
// browser- and file-size-dependent — a download of a small file on a
// fast machine "works" while the same code truncates a large file on a
// slow one.

export function downloadBlob(
  content: Blob | string,
  fileName: string,
  mimeType: string
): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default downloadBlob;