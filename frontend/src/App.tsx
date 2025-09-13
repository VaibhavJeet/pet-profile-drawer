import { useState } from "react";
import ClientList from "./components/ClientList/ClientList";
import PetDrawer from "./components/PetDrawer/PetDrawer";

function App() {
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"clients" | "pets">("clients");

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* header */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <img
                src="/seed/dog1.png"
                alt="Pet Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Pet Profile Drawer
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-full bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setViewMode("clients")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    viewMode === "clients"
                      ? "bg-[#f67d58] text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Clients
                </button>
                <button
                  onClick={() => setViewMode("pets")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    viewMode === "pets"
                      ? "bg-[#f67d58] text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Pets
                </button>
              </div>
            </div>

            <ClientList onPetSelect={setSelectedPetId} viewMode={viewMode} />
          </div>
        </aside>

        <main className="flex-1 bg-gray-50 overflow-y-auto">
          {selectedPetId !== null && (
            <div className="absolute inset-0 flex">
              <PetDrawer
                petId={selectedPetId}
                onClose={() => setSelectedPetId(null)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
