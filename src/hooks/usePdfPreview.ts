import { useCallback, useEffect, useRef, useState } from 'react';

type PdfPreviewState = {
  file: File | null;
  objectUrl: string | null;
  version: number;
};

export function usePdfPreview() {
  const objectUrlRef = useRef<string | null>(null);
  const [state, setState] = useState<PdfPreviewState>({
    file: null,
    objectUrl: null,
    version: 0,
  });

  const revokeCurrentObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    revokeCurrentObjectUrl();
    setState(prev => ({
      file: null,
      objectUrl: null,
      version: prev.version + 1,
    }));
  }, [revokeCurrentObjectUrl]);

  const setFile = useCallback((file: File) => {
    revokeCurrentObjectUrl();

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;

    setState(prev => ({
      file,
      objectUrl,
      version: prev.version + 1,
    }));
  }, [revokeCurrentObjectUrl]);

  useEffect(() => revokeCurrentObjectUrl, [revokeCurrentObjectUrl]);

  return {
    ...state,
    setFile,
    clear,
  };
}
