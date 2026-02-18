import { useState, useCallback } from 'react';
import { DonneesExtraites } from './usePdfImport';

export function useImportPreviewEditor(
  extractedData: DonneesExtraites | null,
  setExtractedData: React.Dispatch<React.SetStateAction<DonneesExtraites | null>>
) {
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [expandedPreviewPieces, setExpandedPreviewPieces] = useState<number[]>([]);

  const updateExtractedData = useCallback((updater: (data: DonneesExtraites) => DonneesExtraites) => {
    if (extractedData) {
      setExtractedData(updater(extractedData));
    }
  }, [extractedData, setExtractedData]);

  const updatePiece = useCallback((pieceIdx: number, field: string, value: string) => {
    updateExtractedData(data => {
      const pieces = [...(data.pieces || [])];
      pieces[pieceIdx] = { ...pieces[pieceIdx], [field]: value };
      return { ...data, pieces };
    });
  }, [updateExtractedData]);

  const updateElement = useCallback((pieceIdx: number, elIdx: number, field: string, value: string) => {
    updateExtractedData(data => {
      const pieces = [...(data.pieces || [])];
      const elements = [...(pieces[pieceIdx].elements || [])];
      elements[elIdx] = { ...elements[elIdx], [field]: value };
      pieces[pieceIdx] = { ...pieces[pieceIdx], elements };
      return { ...data, pieces };
    });
  }, [updateExtractedData]);

  const removePiece = useCallback((pieceIdx: number) => {
    updateExtractedData(data => ({
      ...data,
      pieces: (data.pieces || []).filter((_, i) => i !== pieceIdx),
    }));
  }, [updateExtractedData]);

  const removeElement = useCallback((pieceIdx: number, elIdx: number) => {
    updateExtractedData(data => {
      const pieces = [...(data.pieces || [])];
      pieces[pieceIdx] = {
        ...pieces[pieceIdx],
        elements: pieces[pieceIdx].elements.filter((_, i) => i !== elIdx),
      };
      return { ...data, pieces };
    });
  }, [updateExtractedData]);

  const removeCompteur = useCallback((idx: number) => {
    updateExtractedData(data => ({
      ...data,
      compteurs: (data.compteurs || []).filter((_, i) => i !== idx),
    }));
  }, [updateExtractedData]);

  const removeCle = useCallback((idx: number) => {
    updateExtractedData(data => ({
      ...data,
      cles: (data.cles || []).filter((_, i) => i !== idx),
    }));
  }, [updateExtractedData]);

  const togglePreviewPiece = useCallback((idx: number) => {
    setExpandedPreviewPieces(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  }, []);

  return {
    isEditingPreview,
    setIsEditingPreview,
    expandedPreviewPieces,
    updateExtractedData,
    updatePiece,
    updateElement,
    removePiece,
    removeElement,
    removeCompteur,
    removeCle,
    togglePreviewPiece,
  };
}
