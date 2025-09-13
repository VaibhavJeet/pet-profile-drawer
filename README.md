# Pet Profile Drawer App

Hey there! This is the Pet Profile Drawer app, It’s a React-based single-page app with a searchable client/pet list on the left and a drawer on the right for pet details. I’ve poured some effort into making it functional and user-friendly, and I’ll walk you through how to get it running and what I’ve done.

## Setup & Run

1. **Install dependencies**: Jump into the project folders (frontend and backend) and run `npm install` to install all the dependencies.
2. **Run mock backend**: I’ve set up a mock data API using `express-server` that combines the seed data from `clients.json`, `pets.json`, `vaccinations.json`, `grooming.json`, and `bookings.json`
3. **Run the app**: Run the dev server (frontend and backend) with `npm run dev`. I am using Vite (React + Ts) in frontend, so it’s fast and provides type checks.
4. **Test it out**: For unit tests, run `npm test` (I have set up Jest + React Testing Library to check things like age calculation, edit mode etc).

## Architecture Decisions

I’ve made a few choices to keep this project solid and maintainable:

- **Data Management**: I went with React Query for fetching data and handling mutations. It does updates right away and rolls back if the API fails (which I mocked to fail 30% of the time).
- **Styling**: I've used TailwindCSS for quick, clean styling. Built the tabs and drawer from scratch to avoid heavy UI kits, keeping it lightweight and custom.
- **Mock Backend**: Since this is a mock setup, I handled uploads and deletes by updating the pet object directly in the frontend (no real file system yet). The `POST /photos/upload` just returns a mock URL.
- **Change Request Implemented**: I picked the **Deactivate Pet Flow** change request. You can hit "Actions → Deactivate" in the drawer, enter a reason and it updates the pet status to Inactive.

## What I’ve Done

### Frontend
- **App.tsx**: This is the main setup for the `ClientList` on the left and `PetDrawer` on the right. It tracks which pet is selected to open the drawer.
- **ClientList (src/components/ClientList/ClientList.tsx)**: Built a searchable list with a 300ms debounced search (you can type a client or pet name) and press enter, an "Include Inactive" toggle, and status badges. Used a `TableComponent` for a table view with pagination, sorting, and filters—click a pet avatar, and the drawer pops up.
- **PetDrawer (src/components/PetDrawer/PetDrawer.tsx)**: It shows the pet’s avatar, name, status, and an **Actions** menu. The tabs—**Pet Details**, **Photos**, **Vaccinations**, **Grooming**, and **Bookings**—are all there. **Pet Details** lets you edit inline with validation (weight 0-200, no future DOBs, required fields), and I added age calculation from DOB. **Photos** has drag-and-drop upload (base64 for mock upload preview), and the other tabs display data in tables.
- **TableComponent (src/components/shared/TableComponent.tsx)**: A reusable table with search, filter, sort, and pagination—customized it for clients and pets with avatars.
- **KeyValueTable (src/components/shared/KeyValueTable.tsx)**: A small grid component to show and edit pet details in the drawer.

### Backend
- **Mock API**: Run the server (express) on port 3000. It handles:
  - `GET /clients` for the client list.
  - `GET /pets?clientId=` for pets by client.
  - `GET /pets/:id` for a single pet.
  - `PUT /pets/:id` to update details (with a 30% fail chance mocked).
  - `GET /vaccinations?petId=`, `GET /grooming?petId=`, `GET /bookings?petId=` for related data.
  - `POST /photos/upload` returns a mock URL.
  - `DELETE /photos/:id` is mocked for deletion.
- **Seed Data**: Used the provided JSON in to populate clients, pets, vaccinations, grooming, and bookings.

## Things to Know
- **No Real File Upload**: The photo upload is mocked—returns a URL but doesn’t save files for real.
