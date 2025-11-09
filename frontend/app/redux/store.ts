import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./services/apiSlice";
import { ibgeApiSlice } from "./services/ibgeApiSlice";
import authReducer from "./features/authSlice";
import modalReducer from "./features/modalSlice";
import loggerMiddleware from "./middleware/loggerMiddleware";

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        [ibgeApiSlice.reducerPath]: ibgeApiSlice.reducer,
        auth: authReducer,
        modal: modalReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            apiSlice.middleware,
            ibgeApiSlice.middleware,
            ...(process.env.NODE_ENV !== "production" ? [loggerMiddleware] : [])
        ),
    devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<(typeof store)["getState"]>;
export type AppDispatch = (typeof store)["dispatch"];
