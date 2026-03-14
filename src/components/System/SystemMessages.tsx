/**
 * システムメッセージ表示コンポーネント
 * 野狐囲碁風のメッセージログ
 */

interface SystemMessagesProps {
  messages: string[];
  maxDisplay?: number;
}

export function SystemMessages({ messages, maxDisplay = 5 }: SystemMessagesProps) {
  const displayMessages = messages.slice(-maxDisplay);

  return (
    <div className="system-messages">
      {displayMessages.map((msg, i) => (
        <div key={messages.length - maxDisplay + i} className="system-message-item">
          <span className="system-message-prefix">系統消息:</span>
          {msg}
        </div>
      ))}
    </div>
  );
}
