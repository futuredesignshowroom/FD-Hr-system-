'use client';

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b font-bold">Employees</div>
          <div className="divide-y">
            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <p className="font-semibold">John Doe</p>
              <p className="text-sm text-gray-500">Last message...</p>
            </div>
            <div className="p-4 hover:bg-gray-50 cursor-pointer">
              <p className="font-semibold">Jane Smith</p>
              <p className="text-sm text-gray-500">Last message...</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
          <div className="p-4 border-b font-bold">Chat with Employee</div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg p-3 max-w-xs">
                  Hi, can I help you?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-lg p-3 max-w-xs">
                  Yes, regarding my salary...
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t">
            <form className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded px-3 py-2"
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
