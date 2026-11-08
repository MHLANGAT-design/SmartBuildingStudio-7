using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeviceDiscoveryService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DiscoverySessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuildingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FloorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DrawingDocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GatewayId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    LineIds = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    StartedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FailedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscoverySessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DiscoveredDevices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExternalId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    LineId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ShortAddress = table.Column<int>(type: "int", nullable: true),
                    IsOnline = table.Column<bool>(type: "bit", nullable: false),
                    FirstSeenAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastSeenAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DiscoverySessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscoveredDevices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiscoveredDevices_DiscoverySessions_DiscoverySessionId",
                        column: x => x.DiscoverySessionId,
                        principalTable: "DiscoverySessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DiscoveryHistoryEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Details = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DiscoverySessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscoveryHistoryEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiscoveryHistoryEntries_DiscoverySessions_DiscoverySessionId",
                        column: x => x.DiscoverySessionId,
                        principalTable: "DiscoverySessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DeviceIdentifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Gtin = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    Manufacturer = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Model = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    FirmwareVersion = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    SerialNumber = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    DeviceType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    IdentifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DiscoveredDeviceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceIdentifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeviceIdentifications_DiscoveredDevices_DiscoveredDeviceId",
                        column: x => x.DiscoveredDeviceId,
                        principalTable: "DiscoveredDevices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DeviceMatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeviceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FixtureId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Confidence = table.Column<double>(type: "float", nullable: true),
                    Discrepancies = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MatchedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DiscoveredDeviceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceMatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeviceMatches_DiscoveredDevices_DiscoveredDeviceId",
                        column: x => x.DiscoveredDeviceId,
                        principalTable: "DiscoveredDevices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceIdentifications_DiscoveredDeviceId",
                table: "DeviceIdentifications",
                column: "DiscoveredDeviceId",
                unique: true,
                filter: "[DiscoveredDeviceId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceMatches_DiscoveredDeviceId",
                table: "DeviceMatches",
                column: "DiscoveredDeviceId",
                unique: true,
                filter: "[DiscoveredDeviceId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DiscoveredDevices_DiscoverySessionId",
                table: "DiscoveredDevices",
                column: "DiscoverySessionId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscoveredDevices_ExternalId",
                table: "DiscoveredDevices",
                column: "ExternalId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscoveryHistoryEntries_DiscoverySessionId",
                table: "DiscoveryHistoryEntries",
                column: "DiscoverySessionId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscoveryHistoryEntries_OccurredAt",
                table: "DiscoveryHistoryEntries",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_DiscoverySessions_CreatedAt",
                table: "DiscoverySessions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_DiscoverySessions_FloorId",
                table: "DiscoverySessions",
                column: "FloorId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscoverySessions_ProjectId",
                table: "DiscoverySessions",
                column: "ProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeviceIdentifications");

            migrationBuilder.DropTable(
                name: "DeviceMatches");

            migrationBuilder.DropTable(
                name: "DiscoveryHistoryEntries");

            migrationBuilder.DropTable(
                name: "DiscoveredDevices");

            migrationBuilder.DropTable(
                name: "DiscoverySessions");
        }
    }
}
