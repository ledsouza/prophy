import { createSlice } from "@reduxjs/toolkit";

type AuthState = {
    isAuthenticated: boolean;
    isLoading: boolean;
    Error: string | null;
};

const initialState = {
    isAuthenticated: false,
    isLoading: true,
    Error: null,
} as AuthState;

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuth: (state) => {
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.isAuthenticated = false;
        },
        finishInitialLoad: (state) => {
            state.isLoading = false;
        },
        setError: (state, { payload }) => {
            state.Error = payload;
        },
    },
});

export const { setAuth, logout, finishInitialLoad, setError } =
    authSlice.actions;
export default authSlice.reducer;
