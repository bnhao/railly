// app/loading.tsx
import LoadingSpinner from "@/components/Loadingspinner";

export default function Loading() {
    return (
        <div className="flex items-center justify-center w-full h-screen">
            <LoadingSpinner />
        </div>
    );
}
