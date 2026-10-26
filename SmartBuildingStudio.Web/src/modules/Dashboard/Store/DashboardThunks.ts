import { ThunkApiConfig } from "@/Application/ConfigureStore";
import { DashboardApi } from "@/modules/Dashboard/Services/DashboardApi";
import { 
  setDashboardLoading, 
  setDashboardError, 
  populateDashboardTelemetry 
} from "@/modules/Dashboard/Store/DashboardSlice";

/**
 * Helper to dispatch thunks manually without direct Redux Toolkit createAsyncThunk dependency.
 */
type DashboardThunkAction<ReturnType = Promise<void>> = (
  dispatch: ThunkApiConfig["dispatch"],
  getState: () => ThunkApiConfig["state"],
  extra: ThunkApiConfig["extra"]
) => ReturnType;

/**
 * Refreshes all landing page system parameters from backend services
 */
export const loadDashboardOverview = (): DashboardThunkAction => 
  async (dispatch) => {
    dispatch(setDashboardLoading(true));
    try {
      const dataEnvelope = await DashboardApi.fetchMetricsSummary();
      dispatch(populateDashboardTelemetry(dataEnvelope));
    } catch (err: any) {
      dispatch(setDashboardError(err.message || "Failed to establish database telemetry connections."));
    } finally {
      dispatch(setDashboardLoading(false));
    }
  };
