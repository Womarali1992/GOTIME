# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b610c5c7-6c95-4271-8a94-004616d1046c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b610c5c7-6c95-4271-8a94-004616d1046c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Admin Features

### Reservation Management
The admin dashboard includes comprehensive reservation management capabilities:

- **View All Time Slots**: See all available, reserved, and clinic time slots across all courts
- **Add Users to Reservations**: Admins can add users to available time slots or clinics
- **User Selection**: Choose from existing system users or add custom players
- **Interactive Interface**: Click on available time slots to quickly add users
- **Real-time Updates**: All changes are reflected immediately in the interface

### How to Add Users to Reservations
1. Navigate to the Admin dashboard
2. Go to the "Reservations" tab
3. Click "Add User to Reservation" button or click on an available time slot
4. Select the desired time slot or clinic
5. Choose an existing user or add a custom player
6. Specify the number of players
7. Submit to create the reservation

The system automatically handles:
- Marking time slots as unavailable when booked
- Preventing double-booking
- Maintaining clinic availability for multiple participants

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b610c5c7-6c95-4271-8a94-004616d1046c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
