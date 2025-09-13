import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import { FiChevronDown, FiEdit2 } from "react-icons/fi";
import type {
  Pet,
  Vaccination,
  Grooming,
  Booking,
} from "../../types/response-format";
import {
  fetchPet,
  fetchVaccinations,
  fetchGrooming,
  fetchBookings,
} from "../../services";
import KeyValueTable from "../shared/KeyValueTable";

const PetDrawer = ({
  petId,
  onClose,
}: {
  petId: number;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const {
    data: pet,
    isLoading: petLoading,
    error,
  } = useQuery<Pet>({
    queryKey: ["pet", petId],
    queryFn: () => fetchPet(petId),
  });

  const [activeTab, setActiveTab] = useState<
    "details" | "photos" | "vaccinations" | "grooming" | "bookings"
  >("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editedPet, setEditedPet] = useState<Pet | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [newAttribute, setNewAttribute] = useState("");
  const [vaccSortField, setVaccSortField] = useState<"date" | "due" | null>(
    "date"
  );
  const [vaccSortOrder, setVaccSortOrder] = useState<"asc" | "desc">("asc");
  const [groomSortField, setGroomSortField] = useState<"date" | null>("date");
  const [groomSortOrder, setGroomSortOrder] = useState<"asc" | "desc">("asc");
  const [bookSortField, setBookSortField] = useState<"start" | null>("start");
  const [bookSortOrder, setBookSortOrder] = useState<"asc" | "desc">("asc");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [isNeutered, setIsNeutered] = useState(false);

  useEffect(() => {
    if (pet) setEditedPet({ ...pet });
  }, [pet]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const updatePetMutation = useMutation({
    mutationFn: (updatedPet: Pet) =>
      fetch(`http://localhost:3000/pets/${petId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPet),
      }).then((res) => {
        if (!res.ok && Math.random() < 0.3)
          throw new Error("Simulated API failure");
        return res.json();
      }),
    onMutate: async (updatedPet) => {
      await queryClient.cancelQueries({ queryKey: ["pet", petId] });
      const previous = queryClient.getQueryData<Pet>(["pet", petId]);
      queryClient.setQueryData(["pet", petId], updatedPet);
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(["pet", petId], context.previous);
      toast.error(`Update failed: ${err.message}. Changes rolled back.`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      setIsEditing(false);
      toast.success("Pet updated successfully");
    },
  });

  const deactivatePetMutation = useMutation({
    mutationFn: (reason: string) =>
      fetch(`http://localhost:3000/pets/${petId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pet, status: "Inactive", notes: reason }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to deactivate pet");
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
      toast.success("Pet deactivated");
      setIsDeactivateModalOpen(false);
      setDeactivateReason("");
      onClose();
    },
    onError: (err: Error) => {
      toast.error(`Deactivation failed: ${err.message}`);
    },
  });

  const calculateAge = (dob: string): string => {
    const birthDate = new Date(dob);
    const today = new Date();
    let ageYears = today.getFullYear() - birthDate.getFullYear();
    let ageMonths = today.getMonth() - birthDate.getMonth();
    if (today.getDate() < birthDate.getDate()) ageMonths--;
    if (ageMonths < 0) {
      ageMonths += 12;
      ageYears--;
    }
    return `${ageYears} years, ${ageMonths} months`;
  };

  const age = pet?.dob ? calculateAge(pet.dob) : "N/A";

  useEffect(() => {
    if (pet) {
      setEditedPet({ ...pet });
      const genderMatch = pet.gender.match(/^(Neutered\s*-?\s*)?(.+)$/i);
      if (genderMatch) {
        setIsNeutered(!!genderMatch[1]);
        setGender(genderMatch[2] as "Male" | "Female");
      }
    }
  }, [pet]);

  const handleSave = () => {
    if (!editedPet) return;
    const requiredFields = ["name", "type", "breed", "gender", "size"];
    for (const field of requiredFields) {
      if (!editedPet[field as keyof Pet]) {
        toast.error(
          `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
        );
        return;
      }
    }
    const weightStr = editedPet.weightKg.toFixed(2);
    const weightNum = parseFloat(weightStr);
    if (weightNum <= 0 || weightNum > 200) {
      toast.error("Weight must be between 0 and 200 kg");
      return;
    }
    if (new Date(editedPet.dob) > new Date()) {
      toast.error("DOB cannot be in the future");
      return;
    }
    editedPet.gender = `${isNeutered ? "Neutered - " : ""}${gender}`;
    updatePetMutation.mutate(editedPet);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (editedPet && e.target.name !== "gender") {
      setEditedPet({ ...editedPet, [e.target.name]: e.target.value });
    }
  };

  const addAttribute = () => {
    if (editedPet && newAttribute.trim()) {
      if (editedPet.attributes.includes(newAttribute.trim())) {
        toast.error("Attribute already exists");
        return;
      }
      setEditedPet({
        ...editedPet,
        attributes: [...editedPet.attributes, newAttribute.trim()],
      });
      setNewAttribute("");
    }
  };

  const removeAttribute = (index: number) => {
    if (editedPet) {
      setEditedPet({
        ...editedPet,
        attributes: editedPet.attributes.filter((_, i) => i !== index),
      });
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit`);
        return false;
      }
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        toast.error(`File ${file.name} must be PNG, JPG, or WebP`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0 && pet) {
      Promise.all(
        validFiles.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                toast.success(`Preview: ${file.name} added`);
                resolve(reader.result as string);
              };
              reader.onerror = () =>
                reject(new Error(`Failed to read ${file.name}`));
              reader.readAsDataURL(file);
            })
        )
      )
        .then((base64Images) => {
          updatePetMutation.mutate({
            ...pet,
            photos: [...pet.photos, ...base64Images],
          });
        })
        .catch((err) => {
          toast.error(err.message);
        });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
  });

  const handleDeletePhoto = (index: number) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    if (pet) {
      const newPhotos = pet.photos.filter((_, i) => i !== index);
      updatePetMutation.mutate({ ...pet, photos: newPhotos });
    }
  };

  const { data: vaccinations = [], isLoading: vaccLoading } = useQuery<
    Vaccination[]
  >({
    queryKey: ["vaccinations", petId],
    queryFn: () => fetchVaccinations(petId),
  });
  const sortedVaccinations = useMemo(() => {
    return [...vaccinations].sort((a, b) => {
      if (!vaccSortField) return 0;
      const aVal = new Date(a[vaccSortField]);
      const bVal = new Date(b[vaccSortField]);
      return vaccSortOrder === "asc"
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    });
  }, [vaccinations, vaccSortField, vaccSortOrder]);

  const handleVaccSort = (field: "date" | "due") => {
    if (vaccSortField === field)
      setVaccSortOrder(vaccSortOrder === "asc" ? "desc" : "asc");
    else {
      setVaccSortField(field);
      setVaccSortOrder("asc");
    }
  };

  const calculateDaysUntilDue = (dueDateStr: string): number => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const { data: grooming = [], isLoading: groomLoading } = useQuery<Grooming[]>(
    {
      queryKey: ["grooming", petId],
      queryFn: () => fetchGrooming(petId),
    }
  );
  const sortedGrooming = useMemo(() => {
    return [...grooming].sort((a, b) => {
      if (!groomSortField) return 0;
      const aVal = new Date(a.date);
      const bVal = new Date(b.date);
      return groomSortOrder === "asc"
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    });
  }, [grooming, groomSortField, groomSortOrder]);

  const handleGroomSort = (field: "date") => {
    if (groomSortField === field)
      setGroomSortOrder(groomSortOrder === "asc" ? "desc" : "asc");
    else {
      setGroomSortField(field);
      setGroomSortOrder("asc");
    }
  };

  const { data: bookings = [], isLoading: bookLoading } = useQuery<Booking[]>({
    queryKey: ["bookings", petId],
    queryFn: () => fetchBookings(petId),
  });
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      if (!bookSortField) return 0;
      const aVal = new Date(a.start);
      const bVal = new Date(b.start);
      return bookSortOrder === "asc"
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    });
  }, [bookings, bookSortField, bookSortOrder]);

  const handleBookSort = (field: "start") => {
    if (bookSortField === field)
      setBookSortOrder(bookSortOrder === "asc" ? "desc" : "asc");
    else {
      setBookSortField(field);
      setBookSortOrder("asc");
    }
  };

  if (petLoading) {
    return (
      <div className="absolute right-0 top-0 w-full h-full bg-white p-4 shadow-2xl overflow-y-auto animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
            <div className="h-6 w-32 bg-gray-300"></div>
            <div className="h-4 w-16 bg-gray-300 ml-2 rounded-full"></div>
          </div>
          <div className="h-8 w-20 bg-gray-300 rounded"></div>
        </div>
        <div className="h-4 w-48 bg-gray-300 mb-4"></div>
        <div className="border-b mb-4 flex space-x-4">
          <div className="h-8 w-24 bg-gray-300"></div>
          <div className="h-8 w-24 bg-gray-300"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-gray-300"></div>
              <div className="h-4 w-32 bg-gray-300"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (error) return <div className="p-4 text-red-500">Error loading pet</div>;
  if (!pet) return null;

  const petDetailsData = [
    { label: "Type", value: pet.type },
    { label: "Pet Breed", value: pet.breed },
    { label: "Size", value: pet.size },
    { label: "Temper", value: pet.temper },
    { label: "Color", value: pet.color },
    { label: "Gender", value: pet.gender },
    { label: "Weight", value: `${pet.weightKg.toFixed(2)} kg` },
    {
      label: "Attributes",
      value: pet.attributes.map((attr) => (
        <span
          key={attr}
          className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs mr-1 mb-1"
        >
          {attr}
        </span>
      )),
    },
    { label: "Notes", value: pet.notes || "N/A" },
    { label: "Customer's Notes", value: pet.customerNotes || "N/A" },
  ];

  const predefinedAttributes = [
    "Barks",
    "Blind",
    "Escaper",
    "Friendly",
    "Aggressive",
    "Shy",
    "Playful",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pet Profile Drawer"
      className="absolute right-0 top-0 w-full lg:w-7xl h-full bg-white shadow-2xl overflow-y-auto lg:flex"
      tabIndex={-1}
    >
      <button
        onClick={onClose}
        className="absolute top-6 left-4 text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-pink-500 rounded md:top-6 md:left-6"
        aria-label="Close drawer"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* left section */}
      <div className="w-full lg:w-1/4 bg-gray-50 p-4 lg:p-6 border-r border-gray-200 lg:border-r-0">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-300">
            {pet.photos[0] ? (
              <img
                src={pet.photos[0]}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-16 h-16 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.5 7.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM6 11.5a1 1 0 011-1h6a1 1 0 011 1c0 1.657-1.343 3-3 3S6 13.157 6 11.5z" />
              </svg>
            )}
            <button
              onClick={() =>
                alert("Edit main image functionality to be implemented")
              }
              className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow-md focus:ring-2 focus:ring-pink-500 md:bottom-2 md:right-2"
              aria-label="Edit main image"
            >
              <FiEdit2 className="w-4 h-4 text-gray-700" />
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">{pet.name}</h2>
            <span
              className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                pet.status === "Active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {pet.status}
            </span>
          </div>
          <div className="relative w-full">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 focus:ring-2 focus:ring-pink-500 w-full lg:w-auto lg:mx-auto"
              aria-haspopup="true"
              aria-expanded={isActionsOpen}
            >
              Actions
              <FiChevronDown
                className={`w-4 h-4 transition-transform ${
                  isActionsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isActionsOpen && (
              <div className="mt-2 w-full lg:w-auto bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setIsActionsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-gray-800 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                    activeTab !== "details"
                      ? "bg-gray-400 opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={activeTab !== "details"}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setIsDeactivateModalOpen(true);
                    setIsActionsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-800 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  Deactivate
                </button>
              </div>
            )}
          </div>
          <div className="text-gray-600 mt-4 text-center">
            <p className="text-gray-800 font-medium">Date of Birth</p>
            <p>{pet.dob}</p>
            <p className="text-sm">(Age: {age})</p>
          </div>
        </div>
      </div>

      {/* middle section */}
      <div className="w-full lg:w-1/6 bg-white p-4 border-r border-gray-200 overflow-y-auto hidden lg:block">
        <div className="space-y-2">
          <button
            role="tab"
            aria-selected={activeTab === "details"}
            aria-controls="tab-details"
            className={`w-full text-left px-4 py-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-pink-500 focus-visible:ring-offset-2 ${
              activeTab === "details"
                ? "bg-gray-100 text-pink-500"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("details")}
            tabIndex={0}
          >
            Pet Details
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "photos"}
            aria-controls="tab-photos"
            className={`w-full text-left px-4 py-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-pink-500 ${
              activeTab === "photos"
                ? "bg-gray-100 text-pink-500"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("photos")}
          >
            Photos
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "vaccinations"}
            aria-controls="tab-vaccinations"
            className={`w-full text-left px-4 py-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-pink-500 ${
              activeTab === "vaccinations"
                ? "bg-gray-100 text-pink-500"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("vaccinations")}
          >
            Vaccinations
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "grooming"}
            aria-controls="tab-grooming"
            className={`w-full text-left px-4 py-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-pink-500 ${
              activeTab === "grooming"
                ? "bg-gray-100 text-pink-500"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("grooming")}
          >
            Grooming
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "bookings"}
            aria-controls="tab-bookings"
            className={`w-full text-left px-4 py-2 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-pink-500 ${
              activeTab === "bookings"
                ? "bg-gray-100 text-pink-500"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("bookings")}
          >
            Bookings
          </button>
        </div>
      </div>

      {/* right section */}
      <div className="w-full lg:w-3/4 p-4 lg:p-6 overflow-y-auto">
        <div className="lg:hidden mb-6">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500"
          >
            <option value="details">Pet Details</option>
            <option value="photos">Photos</option>
            <option value="vaccinations">Vaccinations</option>
            <option value="grooming">Grooming</option>
            <option value="bookings">Bookings</option>
          </select>
        </div>
        {activeTab === "details" && (
          <div id="tab-details" role="tabpanel" className="space-y-6">
            {isEditing && editedPet ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <label
                    htmlFor="type"
                    className="text-gray-600 font-medium block mb-2"
                  >
                    Type
                  </label>
                  <input
                    id="type"
                    name="type"
                    value={editedPet.type}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="temper"
                    className="text-gray-600 font-medium block mb-2"
                  >
                    Temper
                  </label>
                  <input
                    id="temper"
                    name="temper"
                    value={editedPet.temper}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="breed"
                    className="text-gray-600 font-medium block mb-2"
                  >
                    Pet Breed
                  </label>
                  <input
                    id="breed"
                    name="breed"
                    value={editedPet.breed}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="color"
                    className="text-gray-600 font-medium block mb-2"
                  >
                    Color
                  </label>
                  <input
                    id="color"
                    name="color"
                    value={editedPet.color}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="size"
                    className="text-gray-600 font-medium block mb-2"
                  >
                    Size
                  </label>
                  <input
                    id="size"
                    name="size"
                    value={editedPet.size}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium block mb-2">
                    Gender
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="isNeutered"
                        type="checkbox"
                        checked={isNeutered}
                        onChange={(e) => setIsNeutered(e.target.checked)}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <label
                        htmlFor="isNeutered"
                        className="ml-2 text-sm font-medium text-gray-700"
                      >
                        Neutered
                      </label>
                    </div>
                    <div className="flex space-x-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="Male"
                          checked={gender === "Male"}
                          onChange={(e) =>
                            setGender(e.target.value as "Male" | "Female")
                          }
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Male
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="Female"
                          checked={gender === "Female"}
                          onChange={(e) =>
                            setGender(e.target.value as "Male" | "Female")
                          }
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Female
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-gray-600 font-medium block mb-2">
                    Attributes
                  </label>
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editedPet?.attributes.map((attr, index) => (
                        <span
                          key={`${attr}-${index}`}
                          className="inline-flex items-center bg-gray-200 rounded-full px-3 py-1 text-xs"
                        >
                          {attr}
                          <button
                            type="button"
                            onClick={() => removeAttribute(index)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                      {predefinedAttributes.map((attr) => (
                        <label key={attr} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editedPet?.attributes.includes(attr)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditedPet({
                                  ...editedPet,
                                  attributes: [
                                    ...(editedPet?.attributes || []),
                                    attr,
                                  ],
                                });
                              } else {
                                setEditedPet({
                                  ...editedPet,
                                  attributes: (
                                    editedPet?.attributes || []
                                  ).filter((a) => a !== attr),
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                          />
                          <span className="ml-2 text-xs text-gray-700">
                            {attr}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        id="attributes"
                        name="attributes"
                        value={newAttribute}
                        onChange={(e) => setNewAttribute(e.target.value)}
                        placeholder="Add custom attribute..."
                        className="border border-gray-300 p-2 flex-1 rounded-md focus:ring-2 focus:ring-pink-500"
                      />
                      <button
                        type="button"
                        onClick={addAttribute}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="weightKg"
                    className="text-gray-600 font-medium block mb-2"
                  >
                    Weight (kg)
                  </label>
                  <input
                    id="weightKg"
                    type="number"
                    step="0.01"
                    min="0"
                    max="200"
                    name="weightKg"
                    value={editedPet?.weightKg?.toFixed(2)}
                    onChange={(e) =>
                      setEditedPet({
                        ...editedPet,
                        weightKg: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dob"
                    className="text-gray-600 font-medium block mb-2"
                  >
                    Date of Birth
                  </label>
                  <input
                    id="dob"
                    type="date"
                    name="dob"
                    value={editedPet.dob}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="sm:col-span-2 border-t border-gray-400 pt-4">
                  <label
                    htmlFor="notes"
                    className="text-gray-600 font-medium block mb-2"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={editedPet.notes || ""}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-pink-500"
                    rows={3}
                  />
                </div>
                <div className="sm:col-span-2 border-t border-gray-400 pt-4">
                  <label
                    htmlFor="customerNotes"
                    className="text-gray-600 font-medium block mb-2"
                  >
                    Customer's Notes
                  </label>
                  <textarea
                    id="customerNotes"
                    name="customerNotes"
                    value={editedPet.customerNotes || ""}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-pink-500"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <KeyValueTable data={petDetailsData} editMode={false} />
            )}
            {isEditing ? (
              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (pet) setEditedPet({ ...pet });
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:ring-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  disabled={updatePetMutation.isPending}
                >
                  Save
                </button>
              </div>
            ) : null}
          </div>
        )}
        {activeTab === "photos" && (
          <div id="tab-photos" role="tabpanel" className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed p-4 sm:p-6 text-center cursor-pointer focus:ring-2 focus:ring-pink-500 ${
                isDragActive
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-gray-700">Drop the files here...</p>
              ) : (
                <p className="text-gray-500">
                  Drag 'n' drop photos (PNG/JPG/WebP, ≤ 5MB each), or click to
                  select multiple files
                </p>
              )}
            </div>
            <div className="space-y-4">
              {pet.photos.length ? (
                <>
                  {/* main image */}
                  <div className="relative">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Main Image
                    </h3>
                    <img
                      src={
                        pet.photos[0] && !pet.photos[0].startsWith("data:image")
                          ? pet.photos[0]
                          : "seed/dog1.png"
                      }
                      alt={`${pet.name} main photo`}
                      className="w-full h-64 sm:h-64 object-cover rounded-md"
                    />
                  </div>
                  {/* aditional images */}
                  {pet.photos.length > 1 && (
                    <>
                      <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">
                        Additional Images
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {pet.photos.slice(1).map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={photo}
                              alt={`${pet.name} photo ${index + 2}`}
                              className="w-full h-32 object-cover rounded-md"
                            />
                            <button
                              onClick={() => handleDeletePhoto(index + 1)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 focus:ring-2 focus:ring-red-500"
                              aria-label={`Delete photo ${index + 2}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="relative">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Main Image
                  </h3>
                  <img
                    src="seed/dog1.png"
                    alt={`${pet.name} default photo`}
                    className="w-full h-64 object-cover rounded-md"
                  />
                  <p className="text-gray-500 text-center mt-4">
                    No additional photos available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "vaccinations" && (
          <div id="tab-vaccinations" role="tabpanel" className="space-y-6">
            {vaccLoading ? (
              <div className="animate-pulse">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="h-8 bg-gray-300"></th>
                      <th className="h-8 bg-gray-300"></th>
                      <th className="h-8 bg-gray-300"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(3)].map((_, i) => (
                      <tr key={i}>
                        <td className="h-8 bg-gray-300"></td>
                        <td className="h-8 bg-gray-300"></td>
                        <td className="h-8 bg-gray-300"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : sortedVaccinations.length === 0 ? (
              <p className="text-gray-500 text-center">
                No vaccinations available
              </p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th
                      className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleVaccSort("date")}
                    >
                      Date{" "}
                      {vaccSortField === "date" &&
                        (vaccSortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                      Vaccine
                    </th>
                    <th
                      className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
                      onClick={() => handleVaccSort("due")}
                    >
                      Due{" "}
                      {vaccSortField === "due" &&
                        (vaccSortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVaccinations.map((v) => {
                    const daysUntilDue = calculateDaysUntilDue(v.due);
                    const dueBadge =
                      daysUntilDue > 0 && daysUntilDue <= 30 ? (
                        <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                          Due within {daysUntilDue} days
                        </span>
                      ) : daysUntilDue <= 0 ? (
                        <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                          Overdue
                        </span>
                      ) : null;
                    return (
                      <tr key={v.id} className="border-b border-gray-200">
                        <td className="p-3 text-sm text-gray-900">{v.date}</td>
                        <td className="p-3 text-sm text-gray-900">
                          {v.vaccine}
                        </td>
                        <td className="p-3 text-sm text-gray-900">
                          {v.due} {dueBadge}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
        {activeTab === "grooming" && (
          <div id="tab-grooming" role="tabpanel" className="space-y-6">
            {groomLoading ? (
              <div className="animate-pulse">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="h-8 bg-gray-300"></th>
                      <th className="h-8 bg-gray-300"></th>
                      <th className="h-8 bg-gray-300"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(3)].map((_, i) => (
                      <tr key={i}>
                        <td className="h-8 bg-gray-300"></td>
                        <td className="h-8 bg-gray-300"></td>
                        <td className="h-8 bg-gray-300"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : sortedGrooming.length === 0 ? (
              <p className="text-gray-500 text-center">No grooming records</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th
                      className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleGroomSort("date")}
                    >
                      Date{" "}
                      {groomSortField === "date" &&
                        (groomSortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                      Service
                    </th>
                    <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGrooming.map((g) => (
                    <tr
                      key={g.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-3 text-sm text-gray-900">{g.date}</td>
                      <td className="p-3 text-sm text-gray-900">{g.service}</td>
                      <td className="p-3 text-sm text-gray-900">{g.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {activeTab === "bookings" && (
          <div id="tab-bookings" role="tabpanel" className="space-y-6">
            {bookLoading ? (
              <div className="animate-pulse">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="h-8 bg-gray-300"></th>
                      <th className="h-8 bg-gray-300"></th>
                      <th className="h-8 bg-gray-300"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(3)].map((_, i) => (
                      <tr key={i}>
                        <td className="h-8 bg-gray-300"></td>
                        <td className="h-8 bg-gray-300"></td>
                        <td className="h-8 bg-gray-300"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : sortedBookings.length === 0 ? (
              <p className="text-gray-500 text-center">No bookings</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                      Type
                    </th>
                    <th
                      className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleBookSort("start")}
                    >
                      Date Range{" "}
                      {bookSortField === "start" &&
                        (bookSortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map((b) => {
                    const statusColor =
                      b.status === "Confirmed"
                        ? "bg-green-100 text-green-800"
                        : b.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800";
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="p-3 text-sm text-gray-900">{b.type}</td>
                        <td className="p-3 text-sm text-gray-900">
                          <span
                            className={`bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium`}
                          >
                            {b.start} - {b.end}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-900">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
        {isDeactivateModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-20">
            <div
              role="dialog"
              aria-modal="true"
              className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4"
            >
              <label className="block mb-4 text-gray-700 font-medium">
                Reason for deactivation
              </label>
              <input
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded-md focus:ring-2 focus:ring-pink-500 mb-6"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsDeactivateModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deactivatePetMutation.mutate(deactivateReason)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  disabled={deactivatePetMutation.isPending}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetDrawer;
