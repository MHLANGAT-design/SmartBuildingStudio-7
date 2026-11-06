using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GatewayManagementService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Gateways",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Identifier = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Transport = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    DaliProtocol = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    EndpointHost = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    EndpointPort = table.Column<int>(type: "int", nullable: false),
                    EndpointPath = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    DaliLineCount = table.Column<int>(type: "int", nullable: false),
                    PollingIntervalSeconds = table.Column<int>(type: "int", nullable: false),
                    CommandTimeoutSeconds = table.Column<int>(type: "int", nullable: false),
                    AuthToken = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    ConnectionStatus = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    LastConnectedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastSeenAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastErrorMessage = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gateways", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GatewayAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FloorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DaliNetworkId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GatewayId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GatewayAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GatewayAssignments_Gateways_GatewayId",
                        column: x => x.GatewayId,
                        principalTable: "Gateways",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GatewayConnectionRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConnectedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DisconnectedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DisconnectReason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    RemoteEndpoint = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    GatewayId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GatewayConnectionRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GatewayConnectionRecords_Gateways_GatewayId",
                        column: x => x.GatewayId,
                        principalTable: "Gateways",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GatewayEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    Payload = table.Column<string>(type: "nvarchar(max)", maxLength: 4096, nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GatewayId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GatewayEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GatewayEvents_Gateways_GatewayId",
                        column: x => x.GatewayId,
                        principalTable: "Gateways",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GatewayOperations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OperationType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Payload = table.Column<string>(type: "nvarchar(max)", maxLength: 4096, nullable: true),
                    Result = table.Column<string>(type: "nvarchar(max)", maxLength: 4096, nullable: true),
                    Succeeded = table.Column<bool>(type: "bit", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    GatewayId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GatewayOperations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GatewayOperations_Gateways_GatewayId",
                        column: x => x.GatewayId,
                        principalTable: "Gateways",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_GatewayAssignments_GatewayId",
                table: "GatewayAssignments",
                column: "GatewayId");

            migrationBuilder.CreateIndex(
                name: "IX_GatewayAssignments_ProjectId",
                table: "GatewayAssignments",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_GatewayConnectionRecords_GatewayId",
                table: "GatewayConnectionRecords",
                column: "GatewayId");

            migrationBuilder.CreateIndex(
                name: "IX_GatewayEvents_GatewayId",
                table: "GatewayEvents",
                column: "GatewayId");

            migrationBuilder.CreateIndex(
                name: "IX_GatewayOperations_GatewayId",
                table: "GatewayOperations",
                column: "GatewayId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GatewayAssignments");

            migrationBuilder.DropTable(
                name: "GatewayConnectionRecords");

            migrationBuilder.DropTable(
                name: "GatewayEvents");

            migrationBuilder.DropTable(
                name: "GatewayOperations");

            migrationBuilder.DropTable(
                name: "Gateways");
        }
    }
}
