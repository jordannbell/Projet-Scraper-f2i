import unittest
import importlib
from types import SimpleNamespace
from unittest.mock import MagicMock, patch


def _import_cron_module():
    # Evite l'échec à l'import quand l'env Supabase est absente dans un contexte CI.
    with patch("services.supabase_client.get_supabase", return_value=MagicMock()):
        import services.cron_auto_apply as cron_mod
        return importlib.reload(cron_mod)


class CronAutoApplyUnitTests(unittest.TestCase):
    def setUp(self):
        self.cron_auto_apply = _import_cron_module()
        self.cron_auto_apply._ACTIVE_CAMPAIGN_USERS.clear()

    def test_in_memory_campaign_lock(self):
        user_id = "user-1"
        first = self.cron_auto_apply._acquire_user_campaign_lock(user_id)
        second = self.cron_auto_apply._acquire_user_campaign_lock(user_id)
        self.cron_auto_apply._release_user_campaign_lock(user_id)
        third = self.cron_auto_apply._acquire_user_campaign_lock(user_id)
        self.cron_auto_apply._release_user_campaign_lock(user_id)

        self.assertTrue(first)
        self.assertFalse(second)
        self.assertTrue(third)

    def test_is_user_campaign_running_true_when_active_in_memory(self):
        user_id = "user-2"
        self.cron_auto_apply._acquire_user_campaign_lock(user_id)
        try:
            self.assertTrue(self.cron_auto_apply.is_user_campaign_running(user_id))
        finally:
            self.cron_auto_apply._release_user_campaign_lock(user_id)

    def test_is_user_campaign_running_checks_db_when_not_in_memory(self):
        user_id = "user-3"
        sb = MagicMock()
        query = MagicMock()
        query.select.return_value = query
        query.eq.return_value = query
        query.in_.return_value = query
        query.limit.return_value = query
        query.execute.return_value = SimpleNamespace(data=[{"id": "q1"}])
        sb.table.return_value = query

        old_sb = self.cron_auto_apply.supabase
        self.cron_auto_apply.supabase = sb
        try:
            self.assertTrue(self.cron_auto_apply.is_user_campaign_running(user_id))
        finally:
            self.cron_auto_apply.supabase = old_sb

    def test_mark_match_queued_if_pending(self):
        sb = MagicMock()
        query = MagicMock()
        query.update.return_value = query
        query.eq.return_value = query
        query.select.return_value = query
        query.execute.return_value = SimpleNamespace(data=[{"id": "m1"}])
        sb.table.return_value = query

        old_sb = self.cron_auto_apply.supabase
        self.cron_auto_apply.supabase = sb
        try:
            self.assertTrue(self.cron_auto_apply._mark_match_queued_if_pending("m1"))
        finally:
            self.cron_auto_apply.supabase = old_sb


if __name__ == "__main__":
    unittest.main()
