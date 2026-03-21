export type Language = 'EN' | 'AM';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  language?: Language;
}

export interface Source {
  id: string;
  title: string;
  snippet: string;
  pageNumber?: number;
  relevance?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  createdAt: Date;
}

// Mock streaming response for demo purposes
export async function queryRAG(
  prompt: string,
  language: Language,
  onChunk: (chunk: string) => void,
  onSources: (sources: Source[]) => void,
): Promise<void> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 600));

  const mockSources: Source[] = [
    {
      id: '1',
      title:
        language === 'EN'
          ? 'Ethiopian Trade Policy Report 2024'
          : 'የኢትዮጵያ ንግድ ፖሊሲ ሪፖርት 2024',
      snippet:
        language === 'EN'
          ? 'The bilateral trade agreement between Ethiopia and China reached $2.4 billion in 2023, marking a 15% increase from the previous year...'
          : 'በኢትዮጵያ እና በቻይና መካከል ያለው የሁለትዮሽ የንግድ ስምምነት በ2023 ወደ 2.4 ቢሊዮን ዶላር ደርሷል...',
      pageNumber: 42,
      relevance: 0.95,
    },
    {
      id: '2',
      title:
        language === 'EN' ? 'Economic Development Analysis' : 'የኢኮኖሚ ልማት ትንተና',
      snippet:
        language === 'EN'
          ? 'Key sectors driving growth include manufacturing, agriculture, and services, with particular emphasis on industrial park development...'
          : 'እድገትን የሚያንቀሳቅሱ ዋና ዋና ዘርፎች ማኑፋክቸሪንግ፣ ግብርና እና አገልግሎቶች ናቸው...',
      pageNumber: 18,
      relevance: 0.88,
    },
    {
      id: '3',
      title:
        language === 'EN'
          ? 'Infrastructure Investment Review'
          : 'የመሠረተ ልማት ኢንቨስትመንት ግምገማ',
      snippet:
        language === 'EN'
          ? 'The Grand Ethiopian Renaissance Dam project continues to be a focal point of national infrastructure planning...'
          : 'የታላቁ የኢትዮጵያ ህዳሴ ግድብ ፕሮጀክት የብሔራዊ መሠረተ ልማት እቅድ ማዕከል ሆኖ ቀጥሏል...',
      pageNumber: 7,
      relevance: 0.82,
    },
  ];

  onSources(mockSources);

  const response =
    language === 'EN'
      ? `Based on the retrieved documents, here are the key findings:\n\n**Trade Relations**\nThe bilateral trade agreement between Ethiopia and China has shown significant growth, reaching $2.4 billion in 2023. This represents a 15% increase from the previous fiscal year, driven primarily by manufacturing exports from Ethiopian industrial parks.\n\n**Economic Indicators**\n- GDP growth maintained at 6.1% annually\n- Foreign direct investment increased by 22%\n- Export diversification index improved to 0.47\n\n**Infrastructure Development**\nThe Grand Ethiopian Renaissance Dam remains central to the national development strategy, with projected completion generating 6,450 MW of hydroelectric power.\n\n> "Ethiopia's economic trajectory demonstrates resilient growth patterns despite global headwinds" — Economic Development Analysis, p.18`
      : `ከተመለሱ ሰነዶች ላይ የተገኙ ዋና ዋና ግኝቶች እነሆ:\n\n**የንግድ ግንኙነቶች**\nበኢትዮጵያ እና በቻይና መካከል ያለው የሁለትዮሽ የንግድ ስምምነት ጉልህ እድገት አሳይቷል፣ በ2023 ወደ 2.4 ቢሊዮን ዶላር ደርሷል። ይህ ካለፈው የበጀት ዓመት 15% ጭማሪ ያሳያል።\n\n**የኢኮኖሚ አመልካቾች**\n- የGDP እድገት በዓመት 6.1% ተጠብቋል\n- የውጪ ቀጥታ ኢንቨስትመንት በ22% ጨምሯል\n- የኤክስፖርት ልዩነት ኢንዴክስ ወደ 0.47 ተሻሽሏል\n\n**የመሠረተ ልማት ልማት**\nየታላቁ የኢትዮጵያ ህዳሴ ግድብ 6,450 ሜጋ ዋት የሃይድሮ ኤሌክትሪክ ኃይል ለማመንጨት ታቅዷል።`;

  // Simulate streaming
  const words = response.split(' ');
  for (let i = 0; i < words.length; i++) {
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
    onChunk(words.slice(0, i + 1).join(' '));
  }
}
