/*
 * Test login page.
 * Adds jest-dom matchers (toBeInTheDocument, etc.) and clears the DOM
 * between tests so component tests start from a clean slate.
 */

import '@testing-library/jest-dom';
import "@testing-library/jest-dom/vitest";

import { vi, describe, it, expect } from "vitest";
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from "react-router-dom";

import Login from "@/pages/Login";

vi.mock('../lib/supabase.js', () =>({
    supabase:{
        auth:{
            signInWithOAuth: vi.fn(),
            signInWithPassword: vi.fn(),
        },
    },
}));

vi.mock('../components/effects/Aurora.jsx', () => ({
    default: () => <div data-testid="aurora-mock" />
}));

describe('Login Component - Initial Render', () => {
    it('renders all login elements', () => {

    render(
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Login />
        </BrowserRouter>
    );

        //Checking if text renders
        expect(screen.getByText(/job/i)).toBeInTheDocument();
        expect(screen.getByText(/tracker/i)).toBeInTheDocument();

        expect(screen.getByText(/access/i)).toBeInTheDocument();
        expect(screen.getByText(/your/i)).toBeInTheDocument();
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();

        expect(screen.getByText(/email/i)).toBeInTheDocument();
        expect(screen.getByText(/address/i)).toBeInTheDocument();
        expect(screen.getByText(/password/i)).toBeInTheDocument();

        // Checking for email address input
        const emailInput = screen.getByPlaceholderText(/name@example.com/i);
        expect(emailInput).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('type', 'email')

        // Checking for password input
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        expect(passwordInput).toBeInTheDocument();
        expect(passwordInput).toHaveAttribute('type', 'password');

        // Checking for action buttons
        expect(screen.getByRole('button', { name: /log in/i})).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in with google/i})).toBeInTheDocument();

        // Checking for navigation links
        expect(screen.getByRole('link', { name: /go back/i})).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
    });
});