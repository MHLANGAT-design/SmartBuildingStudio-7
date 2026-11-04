using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CommissioningService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommissioningReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OverallStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TotalDevices = table.Column<int>(type: "int", nullable: false),
                    PassedDevices = table.Column<int>(type: "int", nullable: false),
                    FailedDevices = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommissioningReports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommissioningSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FloorplanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    StartedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApprovedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommissioningSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AddressAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeviceId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LineId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShortAddress = table.Column<int>(type: "int", nullable: false),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false),
                    CommissioningSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AddressAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AddressAssignments_CommissioningSessions_CommissioningSessionId",
                        column: x => x.CommissioningSessionId,
                        principalTable: "CommissioningSessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CommissioningDefects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FaultId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResolvedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CommissioningSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommissioningDefects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommissioningDefects_CommissioningSessions_CommissioningSessionId",
                        column: x => x.CommissioningSessionId,
                        principalTable: "CommissioningSessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CommissioningDevices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExternalId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<int>(type: "int", nullable: true),
                    CommunicationStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastResponseAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FirmwareVersion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ErrorCode = table.Column<int>(type: "int", nullable: true),
                    IsAddressed = table.Column<bool>(type: "bit", nullable: false),
                    CommissioningSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommissioningDevices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommissioningDevices_CommissioningSessions_CommissioningSessionId",
                        column: x => x.CommissioningSessionId,
                        principalTable: "CommissioningSessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CommissioningTests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TestType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CommissioningSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommissioningTests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommissioningTests_CommissioningSessions_CommissioningSessionId",
                        column: x => x.CommissioningSessionId,
                        principalTable: "CommissioningSessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "NetworkState",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LineId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GatewayId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsConnected = table.Column<bool>(type: "bit", nullable: false),
                    TotalDevices = table.Column<int>(type: "int", nullable: false),
                    OnlineDevices = table.Column<int>(type: "int", nullable: false),
                    ErrorCount = table.Column<int>(type: "int", nullable: false),
                    LastScanAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CommissioningSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NetworkState", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NetworkState_CommissioningSessions_CommissioningSessionId",
                        column: x => x.CommissioningSessionId,
                        principalTable: "CommissioningSessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SceneTest",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SceneId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SceneName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExecutedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CommissioningSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SceneTest", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SceneTest_CommissioningSessions_CommissioningSessionId",
                        column: x => x.CommissioningSessionId,
                        principalTable: "CommissioningSessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SignalLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeviceId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SignalType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Payload = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LoggedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CommissioningSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SignalLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SignalLogs_CommissioningSessions_CommissioningSessionId",
                        column: x => x.CommissioningSessionId,
                        principalTable: "CommissioningSessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CommissioningTestResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeviceId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ExpectedValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ActualValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExecutedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DurationMs = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommissioningTestResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommissioningTestResults_CommissioningTests_TestId",
                        column: x => x.TestId,
                        principalTable: "CommissioningTests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AddressAssignments_CommissioningSessionId",
                table: "AddressAssignments",
                column: "CommissioningSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_CommissioningDefects_CommissioningSessionId",
                table: "CommissioningDefects",
                column: "CommissioningSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_CommissioningDevices_CommissioningSessionId",
                table: "CommissioningDevices",
                column: "CommissioningSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_CommissioningTestResults_TestId",
                table: "CommissioningTestResults",
                column: "TestId");

            migrationBuilder.CreateIndex(
                name: "IX_CommissioningTests_CommissioningSessionId",
                table: "CommissioningTests",
                column: "CommissioningSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_NetworkState_CommissioningSessionId",
                table: "NetworkState",
                column: "CommissioningSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SceneTest_CommissioningSessionId",
                table: "SceneTest",
                column: "CommissioningSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SignalLogs_CommissioningSessionId",
                table: "SignalLogs",
                column: "CommissioningSessionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AddressAssignments");

            migrationBuilder.DropTable(
                name: "CommissioningDefects");

            migrationBuilder.DropTable(
                name: "CommissioningDevices");

            migrationBuilder.DropTable(
                name: "CommissioningReports");

            migrationBuilder.DropTable(
                name: "CommissioningTestResults");

            migrationBuilder.DropTable(
                name: "NetworkState");

            migrationBuilder.DropTable(
                name: "SceneTest");

            migrationBuilder.DropTable(
                name: "SignalLogs");

            migrationBuilder.DropTable(
                name: "CommissioningTests");

            migrationBuilder.DropTable(
                name: "CommissioningSessions");
        }
    }
}
