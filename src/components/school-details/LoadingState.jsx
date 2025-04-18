
import React from "react";

export const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h1 className="text-2xl font-bold">Loading...</h1>
      <p className="text-muted-foreground">Fetching school details</p>
    </div>
  );
};
