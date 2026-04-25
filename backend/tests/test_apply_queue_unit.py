import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from services import apply_queue


class ApplyQueueUnitTests(unittest.TestCase):
    def _mock_sb(self, execute_results):
        sb = MagicMock()
        query = MagicMock()
        query.select.return_value = query
        query.eq.return_value = query
        query.in_.return_value = query
        query.order.return_value = query
        query.limit.return_value = query
        query.insert.return_value = query
        query.update.return_value = query
        query.execute.side_effect = execute_results
        sb.table.return_value = query
        return sb

    @patch("services.apply_queue.get_supabase_admin")
    def test_enqueue_returns_existing_active_id(self, mock_get_admin):
        sb = self._mock_sb([SimpleNamespace(data=[{"id": "existing-qid"}])])
        mock_get_admin.return_value = sb

        qid = apply_queue.enqueue_apply_job("m1", "u1")

        self.assertEqual(qid, "existing-qid")
        # Only active lookup is expected, no insert
        sb.table.return_value.insert.assert_not_called()

    @patch("services.apply_queue.get_supabase_admin")
    def test_enqueue_recovers_after_insert_conflict(self, mock_get_admin):
        sb = self._mock_sb(
            [
                SimpleNamespace(data=[]),  # no active queue
                RuntimeError("duplicate active queue"),  # insert fails
                SimpleNamespace(data=[{"id": "recovered-qid"}]),  # fallback lookup
            ]
        )
        mock_get_admin.return_value = sb

        qid = apply_queue.enqueue_apply_job("m2", "u2")

        self.assertEqual(qid, "recovered-qid")

    @patch("services.apply_queue.get_supabase_admin")
    def test_claim_queue_item_true_when_row_updated(self, mock_get_admin):
        sb = self._mock_sb([SimpleNamespace(data=[{"id": "q1"}])])
        mock_get_admin.return_value = sb

        ok = apply_queue.claim_queue_item("q1", attempts=2)
        self.assertTrue(ok)

    @patch("services.apply_queue.get_supabase_admin")
    def test_claim_queue_item_false_when_no_pending_row(self, mock_get_admin):
        sb = self._mock_sb([SimpleNamespace(data=[])])
        mock_get_admin.return_value = sb

        ok = apply_queue.claim_queue_item("q2", attempts=1)
        self.assertFalse(ok)


if __name__ == "__main__":
    unittest.main()
