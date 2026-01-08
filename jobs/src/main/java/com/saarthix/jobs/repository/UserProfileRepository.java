package com.saarthix.jobs.repository;

import com.saarthix.jobs.model.UserProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends MongoRepository<UserProfile, String> {
    Optional<UserProfile> findByApplicantEmail(String applicantEmail);
    List<UserProfile> findAllByApplicantEmail(String applicantEmail);
    Optional<UserProfile> findByApplicantId(String applicantId);
}

