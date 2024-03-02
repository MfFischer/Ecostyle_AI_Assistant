import ChatContainer from '@/components/ChatContainer';
import ClientOnly from '@/components/ClientOnly';

export default function Home() {
  return (
    <div className="h-screen">
      <ClientOnly fallback={
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-gray-600">Loading AI Assistant...</div>
        </div>
      }>
        <ChatContainer />
      </ClientOnly>
    </div>
  );
}
