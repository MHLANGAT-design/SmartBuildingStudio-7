using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectExplorerService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFloorPlanDataColumnsToProjectDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DefinedRoomsJson",
                table: "ProjectDocuments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DrawnWallsJson",
                table: "ProjectDocuments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "PixelsToMetresScale",
                table: "ProjectDocuments",
                type: "float",
                nullable: false,
                defaultValue: 1.0);

            migrationBuilder.AddColumn<string>(
                name: "PlacedFixturesJson",
                table: "ProjectDocuments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefinedRoomsJson",
                table: "ProjectDocuments");

            migrationBuilder.DropColumn(
                name: "DrawnWallsJson",
                table: "ProjectDocuments");

            migrationBuilder.DropColumn(
                name: "PixelsToMetresScale",
                table: "ProjectDocuments");

            migrationBuilder.DropColumn(
                name: "PlacedFixturesJson",
                table: "ProjectDocuments");
        }
    }
}
