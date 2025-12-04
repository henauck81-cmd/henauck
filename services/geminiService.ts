import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType, PaymentMethod, Category } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

export interface ParsedTransaction {
  amount: number;
  category: string;
  paymentMethod: string;
  note: string;
  type: string;
}

export const parseVoiceInput = async (text: string): Promise<ParsedTransaction | null> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini");
    return null;
  }

  const systemInstruction = `
    You are an intelligent assistant for an expense tracker app in Ivory Coast (West Africa).
    Extract transaction details from the user's text.
    Currency is XOF (CFA).
    Default payment method if not specified: 'Espèces'.
    Common payment methods: 'Wave', 'Orange Money', 'MTN', 'Moov', 'Espèces'.
    Categories: 'Nourriture & Marché', 'Transport (Woro-woro)', 'Loyer & Électricité', 'Tontine & Épargne', 'Loisirs & Maquis', 'Santé', 'Famille', 'Autre'.
    Type is usually EXPENSE, unless words like 'reçu', 'gagné', 'salaire' are used (INCOME).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            paymentMethod: { type: Type.STRING },
            note: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["EXPENSE", "INCOME"] }
          },
          required: ["amount", "type"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ParsedTransaction;
    }
    return null;
  } catch (error) {
    console.error("Gemini parse error:", error);
    return null;
  }
};

export const getFinancialAdvice = async (transactionsSummary: string): Promise<string> => {
   if (!apiKey) return "Connectez-vous à internet pour recevoir des conseils de Tonton Gemini !";

   try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Voici mes dépenses récentes : ${transactionsSummary}. Donne-moi un conseil court (max 2 phrases), amical et motivant style "Grand Frère Ivoirien" pour mieux gérer mon argent. Utilise l'humour local si possible (nouchi léger).`,
    });
    return response.text || "Économise un peu chaque jour pour assurer tes lendemains !";
   } catch (e) {
     return "Le réseau est un peu lent, mais garde la pêche ! Économise toujours.";
   }
}
