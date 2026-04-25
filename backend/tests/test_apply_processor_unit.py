import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from services import apply_processor


class ApplyProcessorUnitTests(unittest.TestCase):
    def _mock_supabase_with_queue_row(self, status="pending"):
        sb = MagicMock()
        query = MagicMock()
        query.select.return_value = query
        query.eq.return_value = query
        query.execute.return_value = SimpleNamespace(
            data=[
                {
                    "id": "q1",
                    "match_id": "m1",
                    "user_id": "u1",
                    "status": status,
                    "attempts": 0,
                }
            ]
        )
        sb.table.return_value = query
        return sb

    @patch("services.apply_processor.get_supabase_admin")
    @patch("services.apply_processor.claim_queue_item")
    async def _run_claim_false(self, mock_claim, mock_get_admin):
        mock_claim.return_value = False
        mock_get_admin.return_value = self._mock_supabase_with_queue_row(status="pending")

        with patch("services.apply_processor.update_queue_row") as mock_update:
            await apply_processor.process_apply_queue_item_by_id("q1")
            mock_update.assert_not_called()

    def test_process_queue_early_exit_when_claim_fails(self):
        asyncio.run(self._run_claim_false())

    @patch("services.apply_processor.get_supabase_admin")
    @patch("services.apply_processor.claim_queue_item")
    async def _run_skip_non_pending(self, mock_claim, mock_get_admin):
        mock_claim.return_value = True
        mock_get_admin.return_value = self._mock_supabase_with_queue_row(status="processing")

        with patch("services.apply_processor._run_bot_for_match", new=AsyncMock()) as mock_bot:
            await apply_processor.process_apply_queue_item_by_id("q1")
            mock_bot.assert_not_called()

    def test_process_queue_skips_when_row_not_pending(self):
        asyncio.run(self._run_skip_non_pending())


if __name__ == "__main__":
    unittest.main()
