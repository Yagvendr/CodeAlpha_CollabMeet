function ChatBox({
  chatOpen,
  setChatOpen,
  messages,
  message,
  setMessage,
  sendMessage,
  socketId,
})
 {
  if (!chatOpen) {
    return (
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl shadow-xl hover:bg-indigo-700"
      >
        💬
      </button>
    );
  }

  return (
    <>
      {/* Chat Button */}
      <button
        type="button"
        onClick={() => setChatOpen(false)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl shadow-xl hover:bg-indigo-700"
      >
        💬
      </button>

      {/* Chat Box */}
      <div className="fixed bottom-24 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
          <div>
            <h3 className="font-semibold text-gray-800">
              Chat 💬
            </h3>

            <p className="text-xs text-green-600">
              ● Connected
            </p>
          </div>

          <button
            type="button"
            onClick={() => setChatOpen(false)}
            className="text-xl text-gray-500 hover:text-gray-800"
          >
            ×  
          </button>
        </div>

        {/* Messages */}
        <div className="flex h-64 flex-col gap-2 overflow-y-auto bg-gray-100 p-4">

          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-sm text-gray-400">
                No messages yet
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {

              const isMe = msg.sender === socketId;

              return (
                <div
                  key={index}
                  className={`flex ${
                    isMe
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                      isMe
                        ? "rounded-br-md bg-indigo-600 text-white"
                        : "rounded-bl-md bg-white text-gray-800 shadow-sm"
                    }`}
                  >

                    <p
                      className={`mb-1 text-[10px] font-semibold ${
                        isMe
                          ? "text-indigo-200"
                          : "text-indigo-600"
                      }`}
                    >
                      {isMe ? "You" : "Other User"}
                    </p>

                    <p className="break-words text-sm">
                      {msg.message}
                    </p>

                  </div>

                </div>
              );
            })
          )}

        </div>

        {/* Input */}
        <div className="flex gap-2 border-t bg-white p-3">

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="button"
            onClick={sendMessage}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Send
          </button>

        </div>

      </div>
    </>
  );
}

export default ChatBox;

