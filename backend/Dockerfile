# ---- Build Stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files first for layer caching
COPY FoodCaseOpener.slnx ./
COPY src/FoodCaseOpener.Api/FoodCaseOpener.Api.csproj src/FoodCaseOpener.Api/

# Restore dependencies
RUN dotnet restore

# Copy remaining source code
COPY . .

# Publish release build
RUN dotnet publish src/FoodCaseOpener.Api/FoodCaseOpener.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ---- Runtime Stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Copy published output
COPY --from=build /app/publish .

# Render injects PORT env variable at runtime (default 10000) — handled in Program.cs
ENV PORT=10000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 10000

ENTRYPOINT ["dotnet", "FoodCaseOpener.Api.dll"]
