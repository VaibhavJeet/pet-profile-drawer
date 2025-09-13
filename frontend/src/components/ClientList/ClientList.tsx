import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Client, Pet } from "../../types/response-format";
import { fetchClients, fetchPets } from "../../services";
import TableComponent from "../shared/TableComponent";

const ClientList = ({
  onPetSelect,
  viewMode
}: {
  onPetSelect: (petId: number) => void;
  viewMode: "clients" | "pets";
}) => {
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });
  const { data: pets = [], isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ["pets"],
    queryFn: fetchPets,
  });

  const tableData = useMemo(() => {
    if (clientsLoading || petsLoading) return [];
    return clients.map((client) => {
      const clientPets = pets.filter((pet) => pet.clientId === client.id);
      return {
        id: client.id,
        userName: client.name,
        status: client.status,
        pets: clientPets.map((pet) => ({
          id: pet.id,
          name: pet.name,
          avatar: pet.photos[0],
        })),
      };
    });
  }, [clients, pets, clientsLoading, petsLoading]);

  const columns = [
    {
      field: "userName",
      headerName: "Client Name",
      flex: 1,
      renderCell: (row: any) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center text-white font-bold">
            {row.userName[0]}
          </div>
          <span>{row.userName}</span>
        </div>
      ),
    },
    {
      field: "pets",
      headerName: "Pets",
      flex: 1,
      renderCell: (row: any) => (
        <div className="flex space-x-2">
          {row.pets.map((pet: any) => (
            <img
              key={pet.id}
              src={pet.avatar}
              alt={pet.name}
              className="w-8 h-8 rounded-full cursor-pointer"
              onClick={() => onPetSelect(pet.id)}
            />
          ))}
        </div>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
    },
  ];

  if (clientsLoading || petsLoading) return <div className="p-4">Loading clients and pets...</div>;

  if (viewMode === "clients") {
    return (
      <div>
        <TableComponent data={tableData} columns={columns} />
      </div>
    );
  } else {
    return (
      <div>
        <TableComponent data={tableData} columns={columns} />
      </div>
    );
  }
};

export default ClientList;


//   const tableData = useMemo(() => {
//     if (clientsLoading || petsLoading) return [];
//     return clients.map((client) => {
//       const clientPets = pets.filter((pet) => pet.clientId === client.id);
//       const firstPet = clientPets[0];
//       return {
//         id: client.id,
//         userName: client.name,
//         status: client.status,
//         pets: clientPets.map((pet) => ({
//           id: pet.id,
//           name: pet.name,
//           avatar: pet.photos[0],
//         })),
//         type: firstPet ? firstPet.type : "N/A",
//         breed: firstPet ? firstPet.breed : "N/A",
//         color: firstPet ? firstPet.color : "N/A",
//         gender: firstPet ? firstPet.gender : "N/A",
//       };
//     });
//   }, [clients, pets, clientsLoading, petsLoading]);